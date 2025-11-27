import express from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  issueCertificate,
  getStudentCertificates,
  verifyCertificate,
  getIssuedCertificates,
} from '../controllers/certificateController.js';
import { protectUser, protectEducator } from '../middlewares/authMiddleware.js';
import upload from '../configs/multer.js';

const certificateRouter = express.Router();

// Educator routes
certificateRouter.get('/templates', protectEducator, getTemplates);
certificateRouter.post(
  '/templates',
  protectEducator,
  upload.fields([
    { name: 'backgroundImage', maxCount: 1 },
    { name: 'signatureImage', maxCount: 1 },
    { name: 'organizationLogo', maxCount: 1 },
  ]),
  createTemplate
);
certificateRouter.put(
  '/templates/:templateId',
  protectEducator,
  upload.fields([
    { name: 'backgroundImage', maxCount: 1 },
    { name: 'signatureImage', maxCount: 1 },
    { name: 'organizationLogo', maxCount: 1 },
  ]),
  updateTemplate
);
certificateRouter.delete('/templates/:templateId', protectEducator, deleteTemplate);
certificateRouter.get('/issued', protectEducator, getIssuedCertificates);

// Student routes
certificateRouter.get('/my-certificates', protectUser, getStudentCertificates);
certificateRouter.post('/issue', express.json(), protectUser, issueCertificate);

// Public routes
certificateRouter.get('/verify/:certificateId', verifyCertificate);

export default certificateRouter;

