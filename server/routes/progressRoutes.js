import express from 'express';
import {
  getCourseProgress,
  completeLecture,
  submitQuiz,
  updateTimeSpent,
  submitFinalAssessment,
} from '../controllers/progressController.js';
import { protectUser } from '../middlewares/authMiddleware.js';

const progressRouter = express.Router();

progressRouter.get('/course/:courseId', protectUser, getCourseProgress);
progressRouter.post('/complete-lecture', protectUser, completeLecture);
progressRouter.post('/submit-quiz', protectUser, submitQuiz);
progressRouter.post('/submit-final-assessment', protectUser, submitFinalAssessment);
progressRouter.post('/update-time', protectUser, updateTimeSpent);

export default progressRouter;



