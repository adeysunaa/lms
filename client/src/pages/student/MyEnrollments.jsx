import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { Line } from "rc-progress";
import Footer from "../../components/student/Footer";
import axios from "axios";
import { data } from "react-router-dom";
import { toast } from "react-toastify";

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLectures,
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data } = await axios.post(
            `${backendUrl}/api/user/get-course-progress`,
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Use data from API if available, otherwise calculate from course
          let totalLectures = calculateNoOfLectures(course);
          let lectureCompleted = 0;
          let isCompleted = false;
          let overallProgress = 0;

          if (data.progressData) {
            // Use API data if available
            totalLectures = data.progressData.totalLectures || totalLectures;
            lectureCompleted = data.progressData.completedLectures || 
                              (data.progressData.lectureCompleted ? data.progressData.lectureCompleted.length : 0);
            isCompleted = data.progressData.isCompleted || 
                         data.progressData.overallProgress === 100 ||
                         (data.progressData.completedAt !== null && data.progressData.completedAt !== undefined);
            overallProgress = data.progressData.overallProgress || 0;
          }

          return { 
            totalLectures, 
            lectureCompleted,
            isCompleted,
            overallProgress
          };
        })
      );
      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    }
  }, [enrolledCourses]);

  return (
    <>
      <div className="md:px-32 px-6 pt-20 text-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">
              Progress
            </p>
            <h1 className="text-3xl font-bold">My Enrollments</h1>
            <p className="text-white/70 text-sm">
              Track your ongoing courses and resume where you left off.
            </p>
          </div>
          <button
            onClick={() => navigate("/course-list")}
            className="glass-button border border-white/20 rounded-full px-5 py-2 text-sm"
          >
            Browse Courses
          </button>
        </div>
        <div className="glass-card border border-white/10 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wide text-white/60 bg-white/5 max-sm:hidden">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {enrolledCourses.map((course, index) => {
                const progress = progressArray[index];
                
                // Calculate percentage - use overallProgress if available, otherwise calculate from lectures
                const percent = progress
                  ? (progress.overallProgress > 0 
                      ? progress.overallProgress 
                      : (progress.totalLectures > 0
                          ? Math.round(
                              (progress.lectureCompleted * 100) /
                                progress.totalLectures
                            )
                          : 0))
                  : 0;

                // Check completion status - prioritize isCompleted flag, then check progress
                const status = progress && (
                  progress.isCompleted ||
                  progress.overallProgress === 100 ||
                  (progress.totalLectures > 0 && 
                   progress.lectureCompleted === progress.totalLectures)
                )
                  ? "Completed"
                  : "In progress";

                return (
                  <tr
                    key={course._id}
                    className="text-white/80 max-sm:flex max-sm:flex-col max-sm:gap-4 max-sm:px-4 max-sm:py-4"
                  >
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseTitle}
                        className="w-16 h-12 rounded-xl object-cover border border-white/15"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {course.courseTitle}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <i className="ri-time-line"></i>
                          {calculateCourseDuration(course)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden text-white/70">
                      {calculateCourseDuration(course)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-white/60">
                          {progressArray[index]
                            ? `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures} Lectures`
                            : "0 / 0 Lectures"}
                        </div>
                        <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          status === "Completed"
                            ? "bg-white/15 border border-white/30 text-white"
                            : "glass-button border border-white/20"
                        }`}
                        onClick={() => navigate("/player/" + course._id)}
                      >
                        {status === "Completed" ? "Completed" : "Continue"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollments;
