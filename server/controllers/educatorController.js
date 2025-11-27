import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";



//update role to educator

export const updateRoleToEducator= async(req, res)=>{
    try {
        const userId = req.auth.userId
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata:{
                role: 'educator',
            }
        })
        res.json({success: true, message: 'You can publish a course now'})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// add new course

export const addCourse = async (req, res) => {
    try {
        const {courseData} = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile){
            return res.json({success: false, message: 'Thumbnail Not Attached'})
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        
        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({success: true, message:'Course added'})

    } catch (error) {
        res.json({success: false, message: error.message})
        
    }
};

//Get educator course
export const getEducatorCourses = async(req, res)=>{
     try {
        const educator = req.auth.userId

        const courses = await Course.find({educator})
        res.json({success: true, courses})
     } catch (error) {
        res.json({success: false, message: error.message})
     }
}

export const getCourseForEdit = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const { courseId } = req.params;
    const course = await Course.findOne({ _id: courseId, educator });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const { courseId } = req.params;
    const existingCourse = await Course.findOne({ _id: courseId, educator });

    if (!existingCourse) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const parsedCourseData = JSON.parse(req.body.courseData || "{}");
    existingCourse.courseTitle = parsedCourseData.courseTitle;
    existingCourse.courseDescription = parsedCourseData.courseDescription;
    existingCourse.coursePrice = Number(parsedCourseData.coursePrice);
    existingCourse.discount = Number(parsedCourseData.discount);
    existingCourse.courseContent = parsedCourseData.courseContent || [];

    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path);
      existingCourse.courseThumbnail = imageUpload.secure_url;
    }

    await existingCourse.save();

    res.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//Get educator dashboard data (total earning, enrolled student, No. of courses)

export const educatorDashboardData = async(req, res)=>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const totalCourses = courses.length;

        const courseIds =courses.map(course => course._id);
        
        //calculate total earning from purchases
        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase)=> sum + purchase.amount, 0);

        //collect unique enrolled student IDs with thier course titles
        const enrolledStudentsData = [];
        for(const course of courses){
            const students = await User.find({
                _id: {$in: course.enrolledStudents}
            }, 'name imageUrl');

            students.forEach(student=>{
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle, student
                });
            });
        }

        res.json({success: true, dashboardData: {
            totalEarnings, enrolledStudentsData, totalCourses
        }})

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

//Get enrollment students data with purchase data
export const getEnrolledStudentsData = async(req, res)=>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});

        const courseIds =courses.map(course => course._id);

        const purchases = await Purchase.find({
             courseId: {$in: courseIds},
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({success: true, enrolledStudents})

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}