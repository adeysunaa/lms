import express from 'express';
import { addUserRating, getUserCourseProgress, purchaseCourse, updateUserCourseProgress, updateVideoWatchTime, userData, userEnrolledCourses } from '../controllers/userController.js';
import { getQuiz, submitQuiz } from '../controllers/quizController.js';
import { getTranscript } from '../controllers/transcriptController.js';

const userRouter = express.Router()

userRouter.get('/data', userData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)

userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)
userRouter.post('/update-video-watch-time', updateVideoWatchTime)

// Quiz routes
userRouter.post('/get-quiz', getQuiz)
userRouter.post('/submit-quiz', submitQuiz)

// Transcript route
userRouter.post('/get-transcript', getTranscript)

// Note: Certificate routes are now handled by /api/certificate/* endpoints
// See certificateRoutes.js for the new certificate system

export default userRouter;