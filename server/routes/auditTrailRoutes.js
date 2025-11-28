import express from 'express';
import {
  getAuditTrails,
  getAuditStats,
  getAuditTrailDetails,
} from '../controllers/auditTrailController.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const auditTrailRouter = express.Router();

auditTrailRouter.get('/', protectEducator, getAuditTrails);
auditTrailRouter.get('/stats', protectEducator, getAuditStats);
auditTrailRouter.get('/:auditId', protectEducator, getAuditTrailDetails);

export default auditTrailRouter;

