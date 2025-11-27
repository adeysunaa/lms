import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema({
  educatorId: {
    type: String,
    required: true,
  },
  templateName: {
    type: String,
    required: true,
  },
  backgroundImage: {
    type: String,
    default: '', // Cloudinary URL
  },
  // Certificate content
  title: {
    type: String,
    default: 'Certificate of Completion',
  },
  subtitle: {
    type: String,
    default: 'This is to certify that',
  },
  bodyText: {
    type: String,
    default: 'has successfully completed the course',
  },
  footerText: {
    type: String,
    default: 'with distinction and dedication',
  },
  // Styling
  titleColor: {
    type: String,
    default: '#1a1a1a',
  },
  textColor: {
    type: String,
    default: '#333333',
  },
  accentColor: {
    type: String,
    default: '#4F46E5',
  },
  // Signature
  signatureImage: {
    type: String,
    default: '', // Cloudinary URL
  },
  signatureName: {
    type: String,
    default: '',
  },
  signatureTitle: {
    type: String,
    default: 'Instructor',
  },
  // Organization
  organizationName: {
    type: String,
    default: '',
  },
  organizationLogo: {
    type: String,
    default: '',
  },
  // Settings
  showDate: {
    type: Boolean,
    default: true,
  },
  showCertificateId: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const issuedCertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  educatorId: {
    type: String,
    required: true,
  },
  educatorName: {
    type: String,
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
  },
  // Snapshot of template data at time of issue
  certificateData: {
    type: Object,
    required: true,
  },
  completionDate: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: Number,
    default: 0,
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);
export const IssuedCertificate = mongoose.model('IssuedCertificate', issuedCertificateSchema);
