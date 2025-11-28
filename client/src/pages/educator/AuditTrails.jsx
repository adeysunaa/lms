import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AuditTrails = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const [auditTrails, setAuditTrails] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 100,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAuditTrails();
    fetchStats();
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const fetchAuditTrails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const { data } = await axios.get(
        `${backendUrl}/api/audit-trail?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAuditTrails(data.auditTrails);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to load audit trails');
      }
    } catch (error) {
      console.error('Error fetching audit trails:', error);
      toast.error('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await getToken();
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const { data } = await axios.get(
        `${backendUrl}/api/audit-trail/stats?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      search: '',
      page: 1,
      limit: 100,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCategory = (action, resourceType) => {
    const actionName = action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const typeName = resourceType.replace(/_/g, ' ');
    return `${actionName} - ${typeName}`;
  };

  const formatOldData = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return 'N/A';
    }
    
    const oldValues = [];
    Object.entries(changes).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.from !== undefined) {
        const fieldName = key.replace(/([A-Z])/g, ' $1').trim();
        oldValues.push(`${fieldName}: ${value.from}`);
      }
    });
    
    return oldValues.length > 0 ? oldValues.join(', ') : 'N/A';
  };

  const formatChangedData = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return 'N/A';
    }
    
    const newValues = [];
    Object.entries(changes).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        if (value.to !== undefined) {
          const fieldName = key.replace(/([A-Z])/g, ' $1').trim();
          newValues.push(`${fieldName}: ${value.to}`);
        } else if (value.changed && value.note) {
          newValues.push(value.note);
        }
      }
    });
    
    return newValues.length > 0 ? newValues.join(', ') : 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusUpper = (status || 'SUCCESS').toUpperCase();
    if (statusUpper === 'SUCCESS') {
      return (
        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded-full font-medium border border-green-400/30" style={{ fontSize: '9px' }}>
          Success
        </span>
      );
    } else {
      return (
        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded-full font-medium border border-red-400/30" style={{ fontSize: '9px' }}>
          Failed
        </span>
      );
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import jsPDF and autoTable to ensure proper loading
      const [{ default: jsPDFModule }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      // Create PDF in landscape orientation for more width
      const doc = new jsPDFModule({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      doc.setFontSize(16);
      doc.text('Audit Trail Report', 14, 15);
      
      // Add date range if filtered
      let dateRange = 'All Time';
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? formatDate(filters.startDate) : 'Beginning';
        const end = filters.endDate ? formatDate(filters.endDate) : 'Now';
        dateRange = `${start} - ${end}`;
      }
      doc.setFontSize(9);
      doc.text(`Date Range: ${dateRange}`, 14, 22);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
      
      // Prepare table data with text wrapping for long content
      const tableData = auditTrails.map((trail, index) => [
        String((pagination.page - 1) * pagination.limit + index + 1),
        formatDate(trail.createdAt),
        formatTime(trail.createdAt),
        formatCategory(trail.action, trail.resourceType),
        formatOldData(trail.changes) || 'N/A',
        formatChangedData(trail.changes) || 'N/A',
        trail.educatorName || 'Unknown',
        (trail.status || 'SUCCESS').toUpperCase(),
      ]);

      // Calculate column widths for landscape A4 (297mm width - margins)
      // Landscape A4: 297mm width, minus 14mm margins on each side = 269mm usable
      const columnWidths = {
        0: 12,  // No
        1: 22,  // Date
        2: 18,  // Time
        3: 35,  // Category
        4: 65,  // Old Data (significantly increased)
        5: 65,  // Changed Data (significantly increased)
        6: 28,  // Changed By
        7: 18,  // Status
      };

      // Use autoTable with landscape orientation and optimized settings
      const autoTableOptions = {
        head: [['No', 'Date', 'Time', 'Category', 'Old Data', 'Changed Data', 'Changed By', 'Status']],
        body: tableData,
        startY: 32,
        styles: { 
          fontSize: 6.5,
          cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
          overflow: 'linebreak',
          cellWidth: 'wrap',
          valign: 'top',
          halign: 'left'
        },
        headStyles: { 
          fillColor: [79, 70, 229], 
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: columnWidths[0] },
          1: { cellWidth: columnWidths[1] },
          2: { cellWidth: columnWidths[2] },
          3: { cellWidth: columnWidths[3] },
          4: { cellWidth: columnWidths[4], overflow: 'linebreak' }, // Old Data - wrap text
          5: { cellWidth: columnWidths[5], overflow: 'linebreak' }, // Changed Data - wrap text
          6: { cellWidth: columnWidths[6] },
          7: { cellWidth: columnWidths[7] },
        },
        margin: { left: 14, right: 14, top: 32 },
        showHead: 'everyPage',
        alternateRowStyles: { fillColor: [245, 245, 245] },
        tableWidth: 'wrap',
        didDrawPage: function (data) {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(
            `Page ${doc.internal.pages.length - 1}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      };

      // Use autoTable - it should be available on doc after plugin import
      if (doc.autoTable && typeof doc.autoTable === 'function') {
        doc.autoTable(autoTableOptions);
      } else {
        // Fallback: use the autoTable function directly if available
        const autoTable = autoTableModule?.default || autoTableModule?.autoTable;
        if (autoTable && typeof autoTable === 'function') {
          autoTable(doc, autoTableOptions);
        } else {
          throw new Error('autoTable plugin not loaded');
        }
      }

      // Save PDF
      const filename = `Audit_Trail_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Prepare worksheet data
      const worksheetData = auditTrails.map((trail, index) => ({
        'No': (pagination.page - 1) * pagination.limit + index + 1,
        'Date': formatDate(trail.createdAt),
        'Time': formatTime(trail.createdAt),
        'Category': formatCategory(trail.action, trail.resourceType),
        'Old Data': formatOldData(trail.changes),
        'Changed Data': formatChangedData(trail.changes),
        'Changed By': trail.educatorName || 'Unknown',
        'Status': (trail.status || 'SUCCESS').toUpperCase(),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(worksheetData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 15 }, // Date
        { wch: 12 }, // Time
        { wch: 30 }, // Category
        { wch: 40 }, // Old Data
        { wch: 40 }, // Changed Data
        { wch: 20 }, // Changed By
        { wch: 12 }, // Status
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Trails');

      // Generate filename
      let filename = `Audit_Trail_${new Date().toISOString().split('T')[0]}`;
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? filters.startDate.replace(/-/g, '') : 'All';
        const end = filters.endDate ? filters.endDate.replace(/-/g, '') : 'Now';
        filename += `_${start}_${end}`;
      }
      filename += '.xlsx';

      // Save file
      XLSX.writeFile(wb, filename);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel file');
    }
  };

  const actionOptions = [
    'COURSE_CREATED',
    'COURSE_UPDATED',
    'COURSE_DELETED',
    'CERTIFICATE_TEMPLATE_CREATED',
    'CERTIFICATE_TEMPLATE_UPDATED',
    'CERTIFICATE_TEMPLATE_DELETED',
    'CERTIFICATE_ISSUED',
  ];

  const resourceTypeOptions = [
    'COURSE',
    'CERTIFICATE',
    'STUDENT',
    'QUIZ',
    'FINAL_ASSESSMENT',
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="h2 text-white mb-2">Audit Trails</h1>
          <p className="body text-white/70 hidden sm:block">
            Track and monitor all your activities and changes in the system
          </p>
          <p className="text-sm text-white/70 sm:hidden">Track your activities</p>
        </div>
        {auditTrails.length > 0 && (
          <div className="relative export-dropdown-container w-full sm:w-auto">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <i className="ri-download-line text-lg"></i>
              <span>Export</span>
              <i className={`ri-arrow-down-s-line text-lg transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`}></i>
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 glass-card rounded-xl border border-white/20 shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    handleDownloadExcel();
                    setShowExportDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-file-excel-2-line text-xl text-green-400"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">Export as Excel</span>
                    <span className="text-xs text-white/60">Download as .xlsx file</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    handleDownloadPDF();
                    setShowExportDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-file-pdf-line text-xl text-red-400"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">Export as PDF</span>
                    <span className="text-xs text-white/60">Download as .pdf file</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <i className="ri-file-list-3-line text-xl sm:text-2xl text-blue-400"></i>
              </div>
            </div>
            <h3 className="text-white/60 text-xs sm:text-sm mb-1">Total Activities</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {stats.actionCounts?.reduce((sum, item) => sum + item.count, 0) || 0}
            </p>
          </div>
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <i className="ri-booklet-line text-xl sm:text-2xl text-green-400"></i>
              </div>
            </div>
            <h3 className="text-white/60 text-xs sm:text-sm mb-1">Course Activities</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {stats.resourceTypeCounts?.find(r => r._id === 'COURSE')?.count || 0}
            </p>
          </div>
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <i className="ri-award-line text-xl sm:text-2xl text-purple-400"></i>
              </div>
            </div>
            <h3 className="text-white/60 text-xs sm:text-sm mb-1">Certificate Activities</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">
              {stats.resourceTypeCounts?.find(r => r._id === 'CERTIFICATE')?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">Filters</h3>
          <button
            onClick={handleResetFilters}
            className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors px-2 py-1"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full glass-input border border-white/20 rounded-lg p-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Actions</option>
              {actionOptions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">Resource Type</label>
            <select
              value={filters.resourceType}
              onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              className="w-full glass-input border border-white/20 rounded-lg p-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Types</option>
              {resourceTypeOptions.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full glass-input border border-white/20 rounded-lg p-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full glass-input border border-white/20 rounded-lg p-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by resource name or description..."
              className="w-full glass-input border border-white/20 rounded-lg p-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-white/50"
            />
          </div>
        </div>
      </div>

      {/* Audit Trails Table */}
      {loading ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-white/20">
          <i className="ri-loader-4-line text-4xl sm:text-5xl animate-spin text-white/60"></i>
          <p className="mt-4 text-white/70 text-sm sm:text-base">Loading audit trails...</p>
        </div>
      ) : auditTrails.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 sm:p-12 text-center border border-white/20">
          <i className="ri-file-history-line text-4xl sm:text-6xl mb-4 text-white/40"></i>
          <p className="text-white/70 text-base sm:text-lg mb-4">No audit trails found</p>
          <p className="text-white/60 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: '9px' }}>
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>No</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Date</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Time</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Category</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Old Data</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Changed Data</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Changed By</th>
                    <th className="px-2 py-2 text-left font-semibold text-white/80 uppercase tracking-wider" style={{ fontSize: '9px' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {auditTrails.map((trail, index) => (
                    <tr key={trail._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-2 py-2 text-white/70" style={{ fontSize: '9px' }}>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td className="px-2 py-2 text-white/70" style={{ fontSize: '9px' }}>
                        {formatDate(trail.createdAt)}
                      </td>
                      <td className="px-2 py-2 text-white/70" style={{ fontSize: '9px' }}>
                        {formatTime(trail.createdAt)}
                      </td>
                      <td className="px-2 py-2 text-white/80" style={{ fontSize: '9px' }}>
                        {formatCategory(trail.action, trail.resourceType)}
                      </td>
                      <td className="px-2 py-2 text-white/70 max-w-xs" style={{ fontSize: '9px' }}>
                        <div className="truncate" title={formatOldData(trail.changes)}>
                          {formatOldData(trail.changes)}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-white/70 max-w-xs" style={{ fontSize: '9px' }}>
                        <div className="truncate" title={formatChangedData(trail.changes)}>
                          {formatChangedData(trail.changes)}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-white/70" style={{ fontSize: '9px' }}>
                        {trail.educatorName || 'Unknown'}
                      </td>
                      <td className="px-2 py-2" style={{ fontSize: '9px' }}>
                        {getStatusBadge(trail.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {auditTrails.map((trail, index) => (
              <div
                key={trail._id}
                className="glass-card rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs font-medium">
                      #{(pagination.page - 1) * pagination.limit + index + 1}
                    </span>
                    {getStatusBadge(trail.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-white text-xs font-medium">
                      {formatDate(trail.createdAt)}
                    </div>
                    <div className="text-white/60 text-xs">
                      {formatTime(trail.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-white/60 text-xs">Category:</span>
                    <p className="text-white text-sm font-medium mt-0.5">
                      {formatCategory(trail.action, trail.resourceType)}
                    </p>
                  </div>
                  
                  {formatOldData(trail.changes) !== 'N/A' && (
                    <div>
                      <span className="text-white/60 text-xs">Old Data:</span>
                      <p className="text-white/80 text-xs mt-0.5 break-words">
                        {formatOldData(trail.changes)}
                      </p>
                    </div>
                  )}
                  
                  {formatChangedData(trail.changes) !== 'N/A' && (
                    <div>
                      <span className="text-white/60 text-xs">Changed Data:</span>
                      <p className="text-white/80 text-xs mt-0.5 break-words">
                        {formatChangedData(trail.changes)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-white/60 text-xs">Changed By:</span>
                    <p className="text-white text-xs mt-0.5">
                      {trail.educatorName || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-white/10">
              <p className="text-white/60 text-xs sm:text-sm text-center sm:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex-1 sm:flex-none px-4 py-2 glass-button border border-white/20 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="flex-1 sm:flex-none px-4 py-2 glass-button border border-white/20 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditTrails;
