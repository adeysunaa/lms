import express from 'express'
import { addCourse, educatorDashboardData, getCourseForEdit, getEducatorCourses, getEnrolledStudentsData, updateCourse, updateRoleToEducator } from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleware.js'

const educatorRouter = express.Router()

//update educator role
educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.get('/get-course-for-edit/:courseId', protectEducator, getCourseForEdit)
educatorRouter.put('/update-course/:courseId', upload.single('image'), protectEducator, updateCourse)
export default educatorRouter;