import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import { createAuditLog } from "./auditTrailController.js";



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

        // Create audit log
        await createAuditLog({
          educatorId,
          action: 'COURSE_CREATED',
          resourceType: 'COURSE',
          resourceId: newCourse._id.toString(),
          resourceName: parsedCourseData.courseTitle,
          description: `Created new course: ${parsedCourseData.courseTitle}`,
          changes: {
            courseTitle: parsedCourseData.courseTitle,
            coursePrice: parsedCourseData.coursePrice,
            chapters: parsedCourseData.courseContent?.length || 0,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });

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

    // Save original values BEFORE updating for audit trail
    const originalValues = {
      courseTitle: existingCourse.courseTitle,
      courseDescription: existingCourse.courseDescription,
      coursePrice: existingCourse.coursePrice,
      discount: existingCourse.discount,
      courseThumbnail: existingCourse.courseThumbnail,
      chaptersCount: existingCourse.courseContent?.length || 0,
      lecturesCount: existingCourse.courseContent?.reduce((sum, chapter) => sum + (chapter.chapterContent?.length || 0), 0) || 0,
      quizzesCount: existingCourse.courseContent?.reduce((sum, chapter) => sum + (chapter.quizzes?.length || 0), 0) || 0,
      finalAssessmentsCount: existingCourse.courseContent?.filter(chapter => chapter.finalAssessment).length || 0,
    };

    const parsedCourseData = JSON.parse(req.body.courseData || "{}");
    const newCourseTitle = parsedCourseData.courseTitle;
    const newCourseDescription = parsedCourseData.courseDescription;
    const newCoursePrice = Number(parsedCourseData.coursePrice);
    const newDiscount = Number(parsedCourseData.discount);
    const newCourseContent = parsedCourseData.courseContent || [];
    
    // Update course
    existingCourse.courseTitle = newCourseTitle;
    existingCourse.courseDescription = newCourseDescription;
    existingCourse.coursePrice = newCoursePrice;
    existingCourse.discount = newDiscount;
    existingCourse.courseContent = newCourseContent;

    let thumbnailChanged = false;
    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path);
      existingCourse.courseThumbnail = imageUpload.secure_url;
      thumbnailChanged = true;
    }

    await existingCourse.save();

    // Track detailed changes for audit log
    const changes = {};
    
    // Check title change
    if (newCourseTitle && newCourseTitle !== originalValues.courseTitle) {
      changes.courseTitle = {
        from: originalValues.courseTitle,
        to: newCourseTitle,
      };
    }
    
    // Check description change
    if (newCourseDescription && newCourseDescription !== originalValues.courseDescription) {
      changes.courseDescription = {
        changed: true,
        note: "Course description was modified",
        oldLength: originalValues.courseDescription?.length || 0,
        newLength: newCourseDescription?.length || 0,
      };
    }
    
    // Check price change
    if (newCoursePrice !== originalValues.coursePrice) {
      changes.coursePrice = {
        from: originalValues.coursePrice,
        to: newCoursePrice,
        currency: "USD",
      };
    }
    
    // Check discount change
    if (newDiscount !== originalValues.discount) {
      changes.discount = {
        from: originalValues.discount,
        to: newDiscount,
      };
    }
    
    // Check thumbnail change
    if (thumbnailChanged) {
      changes.courseThumbnail = {
        changed: true,
        note: "Course thumbnail image was updated",
        previousUrl: originalValues.courseThumbnail,
        newUrl: existingCourse.courseThumbnail,
      };
    }
    
    // Check course content structure changes
    const newChaptersCount = newCourseContent.length;
    const newLecturesCount = newCourseContent.reduce((sum, chapter) => sum + (chapter.chapterContent?.length || 0), 0);
    const newQuizzesCount = newCourseContent.reduce((sum, chapter) => sum + (chapter.quizzes?.length || 0), 0);
    const newFinalAssessmentsCount = newCourseContent.filter(chapter => chapter.finalAssessment).length;
    
    if (newChaptersCount !== originalValues.chaptersCount) {
      changes.chapters = {
        from: originalValues.chaptersCount,
        to: newChaptersCount,
      };
    }
    
    if (newLecturesCount !== originalValues.lecturesCount) {
      changes.lectures = {
        from: originalValues.lecturesCount,
        to: newLecturesCount,
      };
    }
    
    if (newQuizzesCount !== originalValues.quizzesCount) {
      changes.quizzes = {
        from: originalValues.quizzesCount,
        to: newQuizzesCount,
      };
    }
    
    if (newFinalAssessmentsCount !== originalValues.finalAssessmentsCount) {
      changes.finalAssessments = {
        from: originalValues.finalAssessmentsCount,
        to: newFinalAssessmentsCount,
      };
    }

    // Only create audit log if there are actual changes
    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        educatorId: educator,
        action: 'COURSE_UPDATED',
        resourceType: 'COURSE',
        resourceId: courseId,
        resourceName: newCourseTitle || originalValues.courseTitle,
        description: `Updated course: ${newCourseTitle || originalValues.courseTitle}`,
        changes,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

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