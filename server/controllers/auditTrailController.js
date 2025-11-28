import AuditTrail from '../models/AuditTrail.js';

// Helper function to create audit trail log
export const createAuditLog = async (data) => {
  try {
    // Get educator name if not provided
    let educatorName = data.educatorName;
    if (!educatorName && data.educatorId) {
      try {
        const User = (await import('../models/User.js')).default;
        const educator = await User.findById(data.educatorId);
        educatorName = educator?.name || 'Unknown';
      } catch (err) {
        console.error('Error fetching educator name:', err);
        educatorName = 'Unknown';
      }
    }

    const auditLog = new AuditTrail({
      educatorId: data.educatorId,
      educatorName: educatorName,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName,
      description: data.description,
      changes: data.changes || {},
      status: data.status || 'SUCCESS',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata || {},
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logging should not break the main operation
    return null;
  }
};

// Get audit trails for an educator
export const getAuditTrails = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const {
      page = 1,
      limit = 50,
      action,
      resourceType,
      startDate,
      endDate,
      resourceId,
      search,
    } = req.query;

    // Build query
    const query = { educatorId };

    if (action) {
      query.action = action;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (resourceId) {
      query.resourceId = resourceId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { resourceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get audit trails
    const auditTrails = await AuditTrail.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await AuditTrail.countDocuments(query);

    res.json({
      success: true,
      auditTrails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching audit trails:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get audit trail statistics
export const getAuditStats = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Get action counts
    const actionCounts = await AuditTrail.aggregate([
      { $match: { educatorId, ...dateQuery } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get resource type counts
    const resourceTypeCounts = await AuditTrail.aggregate([
      { $match: { educatorId, ...dateQuery } },
      {
        $group: {
          _id: '$resourceType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get activity by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityByDay = await AuditTrail.aggregate([
      {
        $match: {
          educatorId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        actionCounts,
        resourceTypeCounts,
        activityByDay,
      },
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get single audit trail details
export const getAuditTrailDetails = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const { auditId } = req.params;

    const auditTrail = await AuditTrail.findOne({
      _id: auditId,
      educatorId,
    }).lean();

    if (!auditTrail) {
      return res.json({
        success: false,
        message: 'Audit trail not found',
      });
    }

    res.json({
      success: true,
      auditTrail,
    });
  } catch (error) {
    console.error('Error fetching audit trail details:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

