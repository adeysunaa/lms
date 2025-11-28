import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  educatorId: {
    type: String,
    required: true,
    index: true,
  },
  educatorName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'COURSE_CREATED',
      'COURSE_UPDATED',
      'COURSE_DELETED',
      'COURSE_PUBLISHED',
      'COURSE_UNPUBLISHED',
      'CERTIFICATE_TEMPLATE_CREATED',
      'CERTIFICATE_TEMPLATE_UPDATED',
      'CERTIFICATE_TEMPLATE_DELETED',
      'CERTIFICATE_ISSUED',
      'CERTIFICATE_REVOKED',
      'STUDENT_ENROLLED',
      'STUDENT_UNENROLLED',
      'QUIZ_CREATED',
      'QUIZ_UPDATED',
      'QUIZ_DELETED',
      'FINAL_ASSESSMENT_CREATED',
      'FINAL_ASSESSMENT_UPDATED',
      'FINAL_ASSESSMENT_DELETED',
      'LECTURE_ADDED',
      'LECTURE_UPDATED',
      'LECTURE_DELETED',
      'CHAPTER_ADDED',
      'CHAPTER_UPDATED',
      'CHAPTER_DELETED',
    ],
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['COURSE', 'CERTIFICATE', 'STUDENT', 'QUIZ', 'FINAL_ASSESSMENT', 'LECTURE', 'CHAPTER'],
  },
  resourceId: {
    type: String,
    required: true,
    index: true,
  },
  resourceName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
auditTrailSchema.index({ educatorId: 1, createdAt: -1 });
auditTrailSchema.index({ resourceType: 1, resourceId: 1 });
auditTrailSchema.index({ action: 1, createdAt: -1 });

const AuditTrail = mongoose.model('AuditTrail', auditTrailSchema);

export default AuditTrail;

