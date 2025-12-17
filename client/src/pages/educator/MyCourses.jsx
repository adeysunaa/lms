import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";

const MyCourses = () => {
  const { currency, backendUrl, getToken, isEducator } = useContext(AppContext);
  const [courses, setCourses] = useState(null);
  const [tooltipState, setTooltipState] = useState({ show: false, x: 0, y: 0, text: "" });
  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/educator/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      data.success && setCourses(data.courses);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses();
    }
  }, [isEducator]);

  return courses ? (
    <div className="min-h-screen w-full px-4 md:px-10 py-8 text-white">
      <div className="glass-card border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Overview
            </p>
            <h2 className="text-2xl font-semibold">My Courses</h2>
              <p className="text-sm text-white/70">
                Monitor revenue, students, and publish dates at a glance.
              </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Earnings</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/10">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3 truncate">
                    <img
                      src={course.courseThumbnail}
                      alt={course.courseTitle}
                      className="w-16 h-12 rounded-xl object-cover border border-white/15"
                    />
                    <span className="truncate">{course.courseTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    {currency}
                    {Math.floor(
                      course.enrolledStudents.length *
                        (course.coursePrice -
                          (course.discount * course.coursePrice) / 100)
                    )}
                  </td>
                  <td className="px-4 py-3">{course.enrolledStudents.length}</td>
                  <td className="px-4 py-3">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    {course.enrolledStudents && course.enrolledStudents.length > 0 ? (
                      <div 
                        className="inline-block relative"
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector('button');
                          if (button) {
                            const rect = button.getBoundingClientRect();
                            const tooltipWidth = 256; // w-64 = 256px
                            // Position tooltip above the button, aligned to the right edge
                            setTooltipState({
                              show: true,
                              x: rect.right - tooltipWidth, // Align right edge of tooltip with right edge of button
                              y: rect.top, // Top of button
                              text: "This course cannot be edited because it has enrolled students. This protects student trust and legal agreements."
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltipState({ show: false, x: 0, y: 0, text: "" })}
                      >
                        <button
                          disabled
                          className="glass-button border border-white/20 rounded-full px-4 py-2 text-xs font-semibold opacity-50 cursor-not-allowed"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/educator/update-course/${course._id}`}
                        className="glass-button border border-white/20 rounded-full px-4 py-2 text-xs font-semibold hover:scale-[1.02]"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Fixed position tooltip that escapes table overflow */}
      {tooltipState.show && (
        <div
          className="fixed z-50 w-64 p-3 bg-gray-900 border border-white/20 rounded-lg text-xs text-white/80 shadow-lg pointer-events-none"
          style={{
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y}px`,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltipState.text}
        </div>
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MyCourses;
