import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const CertificateManagement = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    templateName: '',
    title: 'Certificate of Completion',
    subtitle: 'This is to certify that',
    bodyText: 'has successfully completed the course',
    footerText: 'with distinction and dedication',
    titleColor: '#1a1a1a',
    textColor: '#333333',
    accentColor: '#4F46E5',
    signatureName: '',
    signatureTitle: 'Instructor',
    organizationName: '',
    showDate: true,
    showCertificateId: true,
    isActive: true,
  });

  const [images, setImages] = useState({
    backgroundImage: null,
    signatureImage: null,
    organizationLogo: null,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const { data } = await axios.get(`${backendUrl}/api/certificate/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setTemplates(data.templates);
      } else {
        toast.error(data.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setImages(prev => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();

      // Append form data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append images
      if (images.backgroundImage) {
        formDataToSend.append('backgroundImage', images.backgroundImage);
      }
      if (images.signatureImage) {
        formDataToSend.append('signatureImage', images.signatureImage);
      }
      if (images.organizationLogo) {
        formDataToSend.append('organizationLogo', images.organizationLogo);
      }

      const url = editingTemplate
        ? `${backendUrl}/api/certificate/templates/${editingTemplate._id}`
        : `${backendUrl}/api/certificate/templates`;

      const method = editingTemplate ? 'put' : 'post';

      const { data } = await axios[method](url, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        toast.success(data.message || 'Certificate template saved successfully');
        setShowCreateModal(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        toast.error(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (error.response) {
        toast.error(error.response.data?.message || 'Failed to save template. Server error.');
      } else if (error.request) {
        toast.error('Failed to save template. No response from server. Please check your connection.');
      } else {
        toast.error('Failed to save template. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      title: template.title,
      subtitle: template.subtitle,
      bodyText: template.bodyText,
      footerText: template.footerText,
      titleColor: template.titleColor,
      textColor: template.textColor,
      accentColor: template.accentColor,
      signatureName: template.signatureName,
      signatureTitle: template.signatureTitle,
      organizationName: template.organizationName,
      showDate: template.showDate,
      showCertificateId: template.showCertificateId,
      isActive: template.isActive,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${backendUrl}/api/certificate/templates/${templateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      templateName: '',
      title: 'Certificate of Completion',
      subtitle: 'This is to certify that',
      bodyText: 'has successfully completed the course',
      footerText: 'with distinction and dedication',
      titleColor: '#1a1a1a',
      textColor: '#333333',
      accentColor: '#4F46E5',
      signatureName: '',
      signatureTitle: 'Instructor',
      organizationName: '',
      showDate: true,
      showCertificateId: true,
      isActive: true,
    });
    setImages({
      backgroundImage: null,
      signatureImage: null,
      organizationLogo: null,
    });
    setSubmitting(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="h2 text-white mb-2">Certificate Management</h1>
          <p className="body text-white/70 hidden sm:block">Create and customize certificate templates for your courses</p>
          <p className="text-sm text-white/70 sm:hidden">Create and customize templates</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingTemplate(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
        >
          <i className="ri-add-line text-lg sm:text-xl"></i>
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/20">
          <i className="ri-loader-4-line text-5xl animate-spin text-white/60"></i>
          <p className="mt-4 text-white/70 body">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 sm:p-12 text-center border border-white/20">
          <i className="ri-file-certificate-line text-5xl sm:text-6xl mb-4 text-white/40"></i>
          <p className="text-white/70 body-large mb-4">No certificate templates yet</p>
          <p className="text-white/60 body-small mb-6 px-4">Create your first template to start issuing certificates</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg inline-flex items-center gap-2 text-sm sm:text-base"
          >
            <i className="ri-add-line"></i>
            <span>Create Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className="glass-card rounded-2xl overflow-hidden border border-white/20 hover:border-white/30 transition-all hover:shadow-xl"
            >
              {/* Preview */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 flex flex-col justify-between">
                {template.backgroundImage && (
                  <img
                    src={template.backgroundImage}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                )}
                
                <div className="relative z-10 text-center">
                  {template.organizationLogo && (
                    <img src={template.organizationLogo} alt="Logo" className="h-8 mb-2 mx-auto" />
                  )}
                  <h3 className="text-lg font-bold mb-1" style={{ color: template.titleColor }}>
                    {template.title}
                  </h3>
                  <p className="text-sm" style={{ color: template.textColor }}>
                    {template.subtitle}
                  </p>
                  <p className="text-xs mt-2" style={{ color: template.textColor }}>
                    {template.bodyText}
                  </p>
                </div>

                <div className="relative z-10">
                  {template.footerText && (
                    <p className="text-[10px] italic text-center mb-2 opacity-80" style={{ color: template.textColor }}>
                      {template.footerText}
                    </p>
                  )}
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      {template.signatureName && (
                        <>
                          {template.signatureImage && (
                            <img src={template.signatureImage} alt="Signature" className="h-10 mb-0.5" />
                          )}
                          <p className="text-[8px] font-semibold leading-none mb-0.5" style={{ color: template.textColor }}>
                            {template.signatureName}
                          </p>
                          <p className="text-[7px] leading-none" style={{ color: template.textColor }}>
                            {template.signatureTitle}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right text-[7px] leading-none" style={{ color: template.textColor }}>
                      {template.showDate && <p className="mb-0.5">{new Date().toLocaleDateString()}</p>}
                      {template.showCertificateId && <p className="opacity-60">ID: CERT-XXXX</p>}
                    </div>
                  </div>
                </div>

                {template.isActive && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="glass-light px-3 py-1 rounded-full text-xs text-white font-medium border border-white/20">
                      <i className="ri-check-line text-green-400 mr-1"></i>
                      Active
                    </span>
                  </div>
                )}
              </div>

              {/* Info & Actions */}
              <div className="p-4 sm:p-5">
                <h4 className="text-white font-semibold body-large mb-1">{template.templateName}</h4>
                <p className="text-white/60 body-small mb-4">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 sm:px-4 glass-light text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <i className="ri-edit-line"></i>
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
                    className="px-3 py-2 sm:px-4 glass-light text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-400/20 flex items-center justify-center"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl p-6 md:p-8 max-w-4xl w-full border border-white/20 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <i className="ri-file-certificate-line text-white text-2xl"></i>
                </div>
                <div>
                  <h2 className="h3 text-white">
                    {editingTemplate ? 'Edit Template' : 'Create Certificate Template'}
                  </h2>
                  <p className="body-small text-white/70">Customize your course completion certificate</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-white font-medium mb-2">Template Name *</label>
                <input
                  type="text"
                  name="templateName"
                  value={formData.templateName}
                  onChange={handleInputChange}
                  className="w-full glass-input border border-white/20 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., Professional Certificate, Modern Design"
                  required
                />
              </div>

              {/* Certificate Content */}
              <div className="glass-light rounded-xl p-6 border border-white/20">
                <h3 className="h5 text-white mb-4 flex items-center gap-2">
                  <i className="ri-text"></i>
                  Certificate Content
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Subtitle</label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-white/80 text-sm mb-2">Body Text</label>
                    <input
                      type="text"
                      name="bodyText"
                      value={formData.bodyText}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholder='e.g., has successfully completed the course'
                    />
                    <p className="text-xs text-white/50 mt-1">
                      💡 Note: The course title will be automatically inserted (e.g., "Microsoft Office") when the certificate is issued
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-white/80 text-sm mb-2">Footer Text</label>
                    <input
                      type="text"
                      name="footerText"
                      value={formData.footerText}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="glass-light rounded-xl p-6 border border-white/20">
                <h3 className="h5 text-white mb-4 flex items-center gap-2">
                  <i className="ri-palette-line"></i>
                  Colors
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Title Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="titleColor"
                        value={formData.titleColor}
                        onChange={handleInputChange}
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.titleColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, titleColor: e.target.value }))}
                        className="flex-1 glass-input border border-white/20 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleInputChange}
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1 glass-input border border-white/20 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Accent Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        name="accentColor"
                        value={formData.accentColor}
                        onChange={handleInputChange}
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 glass-input border border-white/20 rounded-lg p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature & Organization */}
              <div className="glass-light rounded-xl p-6 border border-white/20">
                <h3 className="h5 text-white mb-4 flex items-center gap-2">
                  <i className="ri-quill-pen-line"></i>
                  Signature & Organization
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Signature Name</label>
                    <input
                      type="text"
                      name="signatureName"
                      value={formData.signatureName}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Signature Title</label>
                    <input
                      type="text"
                      name="signatureTitle"
                      value={formData.signatureTitle}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholder="e.g., Instructor, CEO"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-white/80 text-sm mb-2">Organization Name</label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="w-full glass-input border border-white/20 rounded-lg p-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      placeholder="Your organization name"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="glass-light rounded-xl p-6 border border-white/20">
                <h3 className="h5 text-white mb-4 flex items-center gap-2">
                  <i className="ri-image-line"></i>
                  Images
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Background Image</label>
                    <input
                      type="file"
                      name="backgroundImage"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 file:transition-all file:shadow-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Signature Image</label>
                    <input
                      type="file"
                      name="signatureImage"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 file:transition-all file:shadow-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Organization Logo</label>
                    <input
                      type="file"
                      name="organizationLogo"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 file:transition-all file:shadow-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="glass-light rounded-xl p-6 border border-white/20">
                <h3 className="h5 text-white mb-4 flex items-center gap-2">
                  <i className="ri-settings-line"></i>
                  Settings
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showDate"
                      checked={formData.showDate}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-blue-500"
                    />
                    <span className="text-white body-small">Show completion date</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="showCertificateId"
                      checked={formData.showCertificateId}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-blue-500"
                    />
                    <span className="text-white body-small">Show certificate ID</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded accent-blue-500"
                    />
                    <span className="text-white body-small">Set as active template</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-6 py-3 glass-light text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-close-line"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement;


