import express from 'express';
import { purchaseCourse, userData, userEnrolledCourses } from '../controllers/userController.js';

const userRouter = express.Router()

userRouter.get('/data', userData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)

export default userRouter;