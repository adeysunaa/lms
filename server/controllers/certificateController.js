import { CertificateTemplate, IssuedCertificate } from '../models/Certificate.js';
import CourseProgress from '../models/CourseProgress.js';
import { v2 as cloudinary } from 'cloudinary';
import connectCloudinary from '../configs/cloudinary.js';
import { v4 as uuidv4 } from 'uuid';

connectCloudinary();

// Get all certificate templates for an educator
export const getTemplates = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    
    const templates = await CertificateTemplate.find({ educatorId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Create new certificate template
export const createTemplate = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const templateData = req.body;
    
    // Upload images if provided
    if (req.files) {
      if (req.files.backgroundImage) {
        const bgResult = await cloudinary.uploader.upload(req.files.backgroundImage[0].path);
        templateData.backgroundImage = bgResult.secure_url;
      }
      
      if (req.files.signatureImage) {
        const sigResult = await cloudinary.uploader.upload(req.files.signatureImage[0].path);
        templateData.signatureImage = sigResult.secure_url;
      }
      
      if (req.files.organizationLogo) {
        const logoResult = await cloudinary.uploader.upload(req.files.organizationLogo[0].path);
        templateData.organizationLogo = logoResult.secure_url;
      }
    }
    
    const template = new CertificateTemplate({
      ...templateData,
      educatorId,
    });
    
    await template.save();
    
    res.json({
      success: true,
      template,
      message: 'Certificate template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update certificate template
export const updateTemplate = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const { templateId } = req.params;
    const updateData = req.body;
    
    const template = await CertificateTemplate.findOne({ _id: templateId, educatorId });
    
    if (!template) {
      return res.json({
        success: false,
        message: 'Template not found',
      });
    }
    
    // Upload new images if provided
    if (req.files) {
      if (req.files.backgroundImage) {
        const bgResult = await cloudinary.uploader.upload(req.files.backgroundImage[0].path);
        updateData.backgroundImage = bgResult.secure_url;
      }
      
      if (req.files.signatureImage) {
        const sigResult = await cloudinary.uploader.upload(req.files.signatureImage[0].path);
        updateData.signatureImage = sigResult.secure_url;
      }
      
      if (req.files.organizationLogo) {
        const logoResult = await cloudinary.uploader.upload(req.files.organizationLogo[0].path);
        updateData.organizationLogo = logoResult.secure_url;
      }
    }
    
    Object.assign(template, updateData);
    await template.save();
    
    res.json({
      success: true,
      template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete certificate template
export const deleteTemplate = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    const { templateId } = req.params;
    
    const template = await CertificateTemplate.findOneAndDelete({ _id: templateId, educatorId });
    
    if (!template) {
      return res.json({
        success: false,
        message: 'Template not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Issue certificate to student (called when course is completed)
export const issueCertificate = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;
    
    const Course = (await import('../models/Course.js')).default;
    const User = (await import('../models/User.js')).default;
    
    // Get course and student info
    const course = await Course.findById(courseId).populate('educator');
    const student = await User.findById(studentId);
    
    if (!course || !student) {
      return res.json({
        success: false,
        message: 'Course or student not found',
      });
    }
    
    // Check if certificate already issued
    const existing = await IssuedCertificate.findOne({ courseId, studentId });
    if (existing) {
      return res.json({
        success: true,
        certificate: existing,
        message: 'Certificate already issued',
      });
    }
    
    // Get educator's active template
    const template = await CertificateTemplate.findOne({
      educatorId: course.educator._id,
      isActive: true,
    });
    
    // Generate unique certificate ID
    const certificateId = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // Get student's progress for grade calculation
    const progress = await CourseProgress.findOne({ studentId, courseId });
    const grade = progress ? progress.overallProgress : 100;
    
    // Create certificate data snapshot with dynamic course name
    const certificateData = template ? {
      ...template.toObject(),
      // Inject course name dynamically into body text
      bodyText: `has successfully completed the course "${course.courseTitle}"`,
    } : {
      title: 'Certificate of Completion',
      subtitle: 'This is to certify that',
      bodyText: `has successfully completed the course "${course.courseTitle}"`,
      footerText: 'with distinction and dedication',
      signatureName: course.educator.name,
      signatureTitle: 'Instructor',
    };
    
    const certificate = new IssuedCertificate({
      certificateId,
      studentId,
      studentName: student.name,
      courseId,
      courseName: course.courseTitle,
      educatorId: course.educator._id,
      educatorName: course.educator.name,
      templateId: template ? template._id : null,
      certificateData,
      completionDate: new Date(),
      grade,
    });
    
    await certificate.save();
    
    // Update course progress
    if (progress) {
      progress.certificateIssued = true;
      progress.certificateId = certificateId;
      await progress.save();
    }
    
    res.json({
      success: true,
      certificate,
      message: 'Certificate issued successfully',
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get student's certificates
export const getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    
    const certificates = await IssuedCertificate.find({ studentId })
      .sort({ completionDate: -1 })
      .populate('courseId');
    
    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get certificate by ID (for verification)
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await IssuedCertificate.findOne({ certificateId })
      .populate('courseId');
    
    if (!certificate) {
      return res.json({
        success: false,
        message: 'Certificate not found',
      });
    }
    
    res.json({
      success: true,
      certificate,
      isValid: certificate.isVerified,
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get issued certificates for educator's courses
export const getIssuedCertificates = async (req, res) => {
  try {
    const educatorId = req.auth.userId;
    
    const certificates = await IssuedCertificate.find({ educatorId })
      .sort({ completionDate: -1 })
      .populate('courseId');
    
    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error('Error fetching issued certificates:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
