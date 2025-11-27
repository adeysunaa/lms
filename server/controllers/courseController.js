import Course from "../models/Course.js";


//Get all courses
export const getAllCourses = async(req, res)=>{
    try {
        const courses = await Course.find({isPublished: true}).select(['-courseContent', '-enrolledStudents']).populate({path:'educator'})

        // Set cache-control headers to prevent caching
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.json({success: true, courses})
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

//Get course by Id
export const getCourseId = async(req, res)=>{
    const {id} = req.params

    try {
        const courseData = await Course.findById(id).populate({path:'educator'})

        //remove lectureUrl if is preview is false
        courseData.courseContent.forEach(chapter=>{
            chapter.chapterContent.forEach(lecture=>{
                if(!lecture.isPreviewFree){
                    lecture.lectureUrl = "";
                }
            })
        })

        // Set cache-control headers to prevent caching
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.json({success: true, courseData})
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}


