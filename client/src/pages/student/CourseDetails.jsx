import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import Footer from "../../components/student/Footer";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { extractYouTubeVideoId } from "../../utils/extractYouTubeVideoId";

const CourseDetails = () => {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setisAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);

  const {
    allCourses,
    calculateRating,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    currency,
    backendUrl,
    userData,
    getToken,
  } = useContext(AppContext);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/course/" + id, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      if (data.success) {
        setCourseData(data.courseData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const enrollCourse = async () => {
    try {
      if (!userData) {
        return toast.warn("Login to Enroll");
      }
      if (isAlreadyEnrolled) {
        return toast.warn("Already Enroll");
      }

      // ✅ Validate courseData and its _id
      if (!courseData || !courseData._id) {
        return toast.error("Invalid course data. Try reloading the page.");
      }
      console.log("Enrolling with course ID:", courseData._id); // ✅ Optional debugging

      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + "/api/user/purchase",
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const { session_url } = data;
        window.location.replace(session_url);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (userData && courseData) {
      setisAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id));
    }
  }, [userData, courseData]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return courseData ? (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-8 relative items-start justify-between md:px-36 px-8 md:pt-32 pt-24 text-left pb-12">
        {/*left column */}

        <div className="max-w-2xl z-10 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            {courseData.courseTitle}
          </h1>
          <p
            className="body-large text-white opacity-90"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200),
            }}
          ></p>

          {/* review and rating */}

          <div className="flex flex-wrap items-center gap-4 mt-6 mb-4 body text-white">
            <div className="flex items-center gap-2 glass-light px-4 py-2 rounded-full text-white">
              <span className="font-semibold text-yellow-400">{calculateRating(courseData)}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`${
                      i < Math.floor(calculateRating(courseData))
                        ? "ri-star-fill text-yellow-400"
                        : "ri-star-line text-white/40"
                    } text-sm`}
                  ></i>
                ))}
              </div>
              <span className="text-white">
                ({courseData.courseRatings.length})
              </span>
            </div>
            <div className="glass-light px-4 py-2 rounded-full text-white">
              <i className="ri-user-line mr-1"></i>
              {courseData.courseRatings.length}
              {courseData.courseRatings.length > 1 ? " students" : " student"}
            </div>
          </div>
          <div className="glass-light inline-flex items-center gap-2 px-4 py-2 rounded-full body-small text-white">
            <i className="ri-user-star-line"></i>
            <span>Course by <span className="font-semibold">{courseData.educator.name}</span></span>
          </div>
          <div className="mt-10 text-white">
            <h2 className="h3 mb-6 text-white">Course Structure</h2>

            <div className="space-y-3">
              {courseData.courseContent.map((chapter, index) => (
                <div
                  key={index}
                  className="glass-card rounded-2xl overflow-hidden border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-3">
                      <i
                        className={`ri-arrow-down-s-line text-xl text-white transform transition-transform duration-300 ${
                          openSections[index] ? "rotate-180" : ""
                        }`}
                      ></i>
                      <p className="font-semibold body-large text-white">
                        {chapter.chapterTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 body-small text-white">
                      <i className="ri-play-list-line"></i>
                      <span>{chapter.chapterContent.length} lectures</span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">{calculateChapterTime(chapter)}</span>
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      openSections[index] ? "max-h-[1000px]" : "max-h-0"
                    }`}
                  >
                    <ul className="px-5 pb-4 pt-2 space-y-2 border-t border-white/10">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <i className="ri-play-circle-line text-lg text-white flex-shrink-0"></i>
                            <p className="body-small truncate text-white">{lecture.lectureTitle}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 body-small text-white">
                            {lecture.isPreviewFree && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const videoId = extractYouTubeVideoId(lecture.lectureUrl);
                                  if (videoId) {
                                    setPlayerData({ videoId });
                                  } else {
                                    toast.error('Invalid YouTube video URL');
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                              >
                                Preview
                              </button>
                            )}
                            <span>
                              {humanizeDuration(
                                lecture.lectureDuration * 60 * 1000,
                                { units: ["h", "m"] }
                              )}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 mb-20 glass-card p-6 rounded-2xl border border-white/20">
            <h3 className="h3 mb-4 text-white">
              Course Details
            </h3>
            <div
              className="body rich-text text-white"
              dangerouslySetInnerHTML={{
                __html: courseData.courseDescription,
              }}
            ></div>
          </div>
        </div>
        {/*right column */}
        <div className="md:sticky md:top-24 max-w-[420px] w-full z-10 glass-card rounded-2xl overflow-hidden border border-white/20 shadow-2xl min-w-[300px] sm:min-w-[420px]">
          <div className="relative overflow-hidden rounded-t-2xl">
            {playerData ? (
              <YouTube
                videoId={playerData.videoId}
                opts={{ playerVars: { autoplay: 1 } }}
                iframeClassName="w-full aspect-video"
              />
            ) : (
              <img src={courseData.courseThumbnail} alt="" className="w-full aspect-video object-cover" />
            )}
          </div>

          <div className="p-6 text-white">
            <div className="glass-light flex items-center gap-2 px-4 py-2 rounded-full inline-flex mb-4 text-white">
              <i className="ri-time-line text-red-400"></i>
              <p className="body-small text-white">
                <span className="font-semibold text-red-400">5 days</span> left at this price!
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center mb-4">
              <p className="text-4xl md:text-5xl font-bold text-white">
                {currency}
                {(
                  courseData.coursePrice -
                  (courseData.discount * courseData.coursePrice) / 100
                ).toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <p className="body-large text-white line-through opacity-60">
                  {currency}
                  {courseData.coursePrice}
                </p>
                <span className="glass-light px-3 py-1 rounded-full body-small font-semibold text-green-400">
                  {courseData.discount}% OFF
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6 body-small text-white">
              <div className="flex items-center gap-1.5">
                <i className="ri-star-fill text-yellow-400"></i>
                <span>{calculateRating(courseData)}</span>
              </div>

              <div className="h-4 w-px bg-white/20"></div>

              <div className="flex items-center gap-1.5">
                <i className="ri-time-line"></i>
                <span>{calculateCourseDuration(courseData)}</span>
              </div>

              <div className="h-4 w-px bg-white/20"></div>

              <div className="flex items-center gap-1.5">
                <i className="ri-book-open-line"></i>
                <span>{calculateNoOfLectures(courseData)} lessons</span>
              </div>
            </div>

            <button
              onClick={enrollCourse}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold body-large transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAlreadyEnrolled}
            >
              {isAlreadyEnrolled ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-checkbox-circle-line"></i>
                  Already Enrolled
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-shopping-cart-line"></i>
                  Enroll Now
                </span>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-white/15">
              <p className="h5 mb-4 text-white">
                What's included?
              </p>
              <ul className="space-y-2.5 body-small text-white">
                <li className="flex items-start gap-2 text-white">
                  <i className="ri-check-line text-green-400 mt-0.5 flex-shrink-0"></i>
                  <span>Lifetime access with free updates</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <i className="ri-check-line text-green-400 mt-0.5 flex-shrink-0"></i>
                  <span>Step-by-step, hands-on project guidance</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <i className="ri-check-line text-green-400 mt-0.5 flex-shrink-0"></i>
                  <span>Downloadable resources and source code</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <i className="ri-check-line text-green-400 mt-0.5 flex-shrink-0"></i>
                  <span>Quizzes to test your knowledge</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <i className="ri-check-line text-green-400 mt-0.5 flex-shrink-0"></i>
                  <span>Certificate of completion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default CourseDetails;
