import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import CertificateModal from "../../components/student/CertificateModal";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";
import { extractYouTubeVideoId } from "../../utils/extractYouTubeVideoId";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses,
  } = useContext(AppContext);

  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificate, setCertificate] = useState(null);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  const getCourseData = () => {
    enrolledCourses.forEach((course) => {
      if (course._id === courseId) {
        setCourseData(course);
        course.courseRatings.forEach((item) => {
          if (item.userId === userData._id) {
            setInitialRating(item.rating);
          }
        });
      }
    });
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses]);

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  const fetchProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/progress/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setProgress(data.progress);
        
        // Check if certificate already issued
        if (data.progress.certificateIssued && data.progress.certificateId) {
          fetchCertificate(data.progress.certificateId);
        }
      } else {
        console.error('Progress fetch failed:', data.message);
        toast.error(data.message || 'Failed to load course progress');
        // Still set a default progress to allow viewing
        setProgress({
          chapters: [],
          overallProgress: 0,
          certificateIssued: false
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load course progress. Please try refreshing.');
      // Set default progress to prevent blank page
      setProgress({
        chapters: [],
        overallProgress: 0,
        certificateIssued: false
      });
    }
  };

  const fetchCertificate = async (certificateId) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/certificate/verify/${certificateId}`
      );

      if (data.success) {
        setCertificate(data.certificate);
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
    }
  };

  const canAccessLecture = (chapterIndex, lectureIndex) => {
    if (!progress) return false;
    
    // First lecture is always accessible
    if (chapterIndex === 0 && lectureIndex === 0) return true;

    // Check if all previous chapters are completed
    for (let i = 0; i < chapterIndex; i++) {
      if (!progress.chapters[i]?.completed) return false;
    }

    // Check if all previous lectures in current chapter are completed
    const currentChapter = progress.chapters[chapterIndex];
    if (!currentChapter) return false;

    for (let i = 0; i < lectureIndex; i++) {
      if (!currentChapter.lectures[i]?.completed) return false;
    }

    return true;
  };

  const canAccessQuiz = (chapterIndex) => {
    if (!progress) return false;

    const currentChapter = progress.chapters[chapterIndex];
    if (!currentChapter) return false;

    // All lectures in the chapter must be completed
    return currentChapter.lectures.every(l => l.completed);
  };

  const isLectureCompleted = (chapterIndex, lectureIndex) => {
    if (!progress) return false;
    return progress.chapters[chapterIndex]?.lectures[lectureIndex]?.completed || false;
  };

  const isQuizPassed = (chapterIndex, quizIndex) => {
    if (!progress) return false;
    return progress.chapters[chapterIndex]?.quizzes[quizIndex]?.passed || false;
  };

  const handleLectureClick = (chapter, lecture, chapterIndex, lectureIndex) => {
    if (!canAccessLecture(chapterIndex, lectureIndex)) {
      toast.warning('Please complete previous lectures first');
      return;
    }

    const videoId = extractYouTubeVideoId(lecture.lectureUrl);
    if (!videoId) {
      toast.error('Invalid YouTube video URL');
      return;
    }

    setPlayerData({
      videoId,
      chapterIndex,
      lectureIndex,
      title: lecture.lectureTitle,
    });
    setShowQuiz(false);
    setQuizResult(null);
  };

  const handleCompleteLecture = async () => {
    if (!playerData) return;

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/progress/complete-lecture`,
        {
          courseId,
          chapterIndex: playerData.chapterIndex,
          lectureIndex: playerData.lectureIndex,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Lecture completed!');
        setProgress(data.progress);

        // Check if course is completed
        if (data.courseCompleted) {
          // Fetch certificate
          const certData = await axios.get(
            `${backendUrl}/api/certificate/my-certificates`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (certData.data.success && certData.data.certificates.length > 0) {
            const courseCert = certData.data.certificates.find(
              c => c.courseId._id === courseId
            );
            if (courseCert) {
              setCertificate(courseCert);
              setShowCertificateModal(true);
            }
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to mark lecture as completed');
    }
  };

  const handleQuizClick = (chapterIndex, quizIndex) => {
    if (!canAccessQuiz(chapterIndex)) {
      toast.warning('Please complete all lectures before taking the quiz');
      return;
    }

    const quiz = courseData.courseContent[chapterIndex].quizzes[quizIndex];
    setCurrentQuiz({ questions: quiz, chapterIndex, quizIndex });
    setQuizAnswers(new Array(quiz.length).fill(null));
    setShowQuiz(true);
    setQuizResult(null);
    setPlayerData(null);
  };

  const handleQuizAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    if (quizAnswers.some(answer => answer === null)) {
      toast.warning('Please answer all questions before submitting');
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/progress/submit-quiz`,
        {
          courseId,
          chapterIndex: currentQuiz.chapterIndex,
          quizIndex: currentQuiz.quizIndex,
          answers: quizAnswers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setQuizResult(data);
        setProgress(data.progress);
        
        if (data.passed) {
          toast.success(`Quiz passed! Score: ${data.score}%`);
        } else {
          toast.error(`Quiz failed. Score: ${data.score}%. You need 70% to pass.`);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) {
      toast.error('No certificate available');
      return;
    }

    try {
      toast.info('Generating PDF... Please wait');
      await generateCertificatePDF(certificate);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate. Please try again.');
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return courseData && progress ? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 md:px-36 pt-24">
        {/* Left Column - Course Structure */}
        <div className="text-white">
          <h2 className="h3 text-white mb-6">Course Structure</h2>

          <div className="space-y-3">
            {courseData.courseContent.map((chapter, chapterIndex) => (
              <div
                key={chapterIndex}
                className="glass-card rounded-2xl overflow-hidden border border-white/20"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                  onClick={() => toggleSection(chapterIndex)}
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={`ri-arrow-down-s-line text-xl text-white transform transition-transform ${
                        openSections[chapterIndex] ? "rotate-180" : ""
                      }`}
                    ></i>
                    <p className="font-semibold body-large text-white">
                      {chapter.chapterTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 body-small text-white/80">
                    <i className="ri-play-list-line"></i>
                    <span>{chapter.chapterContent.length} lectures</span>
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openSections[chapterIndex] ? "max-h-[2000px]" : "max-h-0"
                  }`}
                >
                  <ul className="px-5 pb-4 pt-2 space-y-2 border-t border-white/10">
                    {/* Lectures */}
                    {chapter.chapterContent.map((lecture, lectureIndex) => {
                      const isAccessible = canAccessLecture(chapterIndex, lectureIndex);
                      const isCompleted = isLectureCompleted(chapterIndex, lectureIndex);

                      return (
                        <li
                          key={lectureIndex}
                          className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl transition-all ${
                            isAccessible
                              ? 'hover:bg-white/10 cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                          } ${
                            playerData?.chapterIndex === chapterIndex &&
                            playerData?.lectureIndex === lectureIndex
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30'
                              : ''
                          }`}
                          onClick={() =>
                            handleLectureClick(chapter, lecture, chapterIndex, lectureIndex)
                          }
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isCompleted ? (
                              <i className="ri-checkbox-circle-fill text-green-400 text-lg flex-shrink-0"></i>
                            ) : (
                              <i className="ri-play-circle-line text-lg text-white flex-shrink-0"></i>
                            )}
                            <p className="body-small truncate text-white">
                              {lecture.lectureTitle}
                            </p>
                            {!isAccessible && (
                              <i className="ri-lock-line text-yellow-400 text-sm" title="Complete previous lectures first"></i>
                            )}
                          </div>
                          <div className="flex items-center gap-2 body-small text-white/70 flex-shrink-0">
                            <span>
                              {humanizeDuration(lecture.lectureDuration * 60 * 1000, {
                                units: ["h", "m"],
                              })}
                            </span>
                          </div>
                        </li>
                      );
                    })}

                    {/* Quizzes */}
                    {chapter.quizzes && chapter.quizzes.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-white/10">
                        {chapter.quizzes.map((quiz, quizIndex) => {
                          const isAccessible = canAccessQuiz(chapterIndex);
                          const isPassed = isQuizPassed(chapterIndex, quizIndex);

                          return (
                            <li
                              key={`quiz-${quizIndex}`}
                              className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl transition-all ${
                                isAccessible
                                  ? 'hover:bg-purple-500/20 cursor-pointer border border-purple-400/30'
                                  : 'opacity-50 cursor-not-allowed border border-white/10'
                              } ${
                                showQuiz &&
                                currentQuiz?.chapterIndex === chapterIndex &&
                                currentQuiz?.quizIndex === quizIndex
                                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30'
                                  : 'bg-purple-500/10'
                              }`}
                              onClick={() => handleQuizClick(chapterIndex, quizIndex)}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {isPassed ? (
                                  <i className="ri-medal-fill text-yellow-400 text-xl"></i>
                                ) : (
                                  <i className="ri-questionnaire-line text-purple-400 text-xl"></i>
                                )}
                                <div>
                                  <p className="body-small font-semibold text-white">
                                    Chapter Quiz
                                  </p>
                                  <p className="text-xs text-white/60">
                                    {quiz.length} questions • Passing: 70%
                                  </p>
                                </div>
                                {!isAccessible && (
                                  <i className="ri-lock-line text-yellow-400" title="Complete all lectures first"></i>
                                )}
                              </div>
                              {isPassed && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-400/30">
                                  Passed
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </div>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          {progress && (
            <div className="glass-card rounded-2xl p-6 mt-6 border border-white/20">
              <h3 className="h5 text-white mb-4 flex items-center gap-2">
                <i className="ri-progress-line text-blue-400"></i>
                Your Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-white/80 mb-2">
                    <span className="body-small">Overall Completion</span>
                    <span className="font-semibold">{progress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress.overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {progress.certificateIssued && (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="ri-trophy-line text-xl"></i>
                    View Certificate
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Video Player / Quiz */}
        <div>
          {showQuiz && currentQuiz ? (
            // Quiz View
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 sticky top-24">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i className="ri-questionnaire-line text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="h4 text-white">Chapter Quiz</h3>
                    <p className="body-small text-white/70">
                      {currentQuiz.questions.length} questions • 70% to pass
                    </p>
                  </div>
                </div>

                {quizResult && (
                  <div
                    className={`rounded-xl p-4 mb-4 border ${
                      quizResult.passed
                        ? 'bg-green-500/20 border-green-400/30'
                        : 'bg-red-500/20 border-red-400/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i
                        className={`text-3xl ${
                          quizResult.passed
                            ? 'ri-checkbox-circle-fill text-green-400'
                            : 'ri-close-circle-fill text-red-400'
                        }`}
                      ></i>
                      <div>
                        <p className="font-semibold text-white">
                          {quizResult.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                        </p>
                        <p className="text-sm text-white/80">
                          Score: {quizResult.score}% ({quizResult.correctAnswers}/{quizResult.totalQuestions} correct)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {currentQuiz.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="glass-light rounded-xl p-5 border border-white/20"
                  >
                    <p className="font-semibold text-white mb-4 body">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => {
                        const isSelected = quizAnswers[qIndex] === oIndex;
                        const isCorrect = quizResult && question.correctAnswer === oIndex;
                        const isWrong = quizResult && isSelected && question.correctAnswer !== oIndex;

                        return (
                          <label
                            key={oIndex}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                              quizResult
                                ? isCorrect
                                  ? 'bg-green-500/20 border-green-400/50'
                                  : isWrong
                                  ? 'bg-red-500/20 border-red-400/50'
                                  : 'border-white/10'
                                : isSelected
                                ? 'bg-blue-500/20 border-blue-400/50'
                                : 'border-white/20 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              checked={isSelected}
                              onChange={() => !quizResult && handleQuizAnswerChange(qIndex, oIndex)}
                              disabled={!!quizResult}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-white body-small flex-1">{option}</span>
                            {quizResult && isCorrect && (
                              <i className="ri-check-line text-green-400"></i>
                            )}
                            {quizResult && isWrong && (
                              <i className="ri-close-line text-red-400"></i>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizResult && (
                <button
                  onClick={handleSubmitQuiz}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <i className="ri-send-plane-line"></i>
                  Submit Quiz
                </button>
              )}
            </div>
          ) : playerData ? (
            // Video Player
            <div className="glass-card rounded-2xl overflow-hidden border border-white/20 sticky top-24">
              <YouTube
                videoId={playerData.videoId}
                opts={{
                  width: "100%",
                  playerVars: { autoplay: 1 },
                }}
                className="aspect-video w-full"
              />

              <div className="p-6">
                <h3 className="h4 text-white mb-4">{playerData.title}</h3>

                {!isLectureCompleted(playerData.chapterIndex, playerData.lectureIndex) && (
                  <button
                    onClick={handleCompleteLecture}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="ri-checkbox-circle-line text-xl"></i>
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Welcome Message
            <div className="glass-card rounded-2xl p-12 border border-white/20 text-center sticky top-24">
              <div className="mb-6">
                <i className="ri-play-circle-line text-7xl text-white/40"></i>
              </div>
              <h3 className="h3 text-white mb-3">Welcome to the Course!</h3>
              <p className="body text-white/70 mb-6">
                Select a lecture from the left sidebar to begin your learning journey.
              </p>
              <div className="glass-light rounded-xl p-4 border border-white/20">
                <p className="body-small text-white/80">
                  💡 <strong>Tip:</strong> Complete lectures in order to unlock quizzes and progress through the course.
                </p>
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="glass-card rounded-2xl p-6 mt-6 border border-white/20">
            <h3 className="h5 text-white mb-4 flex items-center gap-2">
              <i className="ri-star-line text-yellow-400"></i>
              Rate This Course
            </h3>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        show={showCertificateModal}
        certificate={certificate}
        onClose={() => setShowCertificateModal(false)}
        onDownload={handleDownloadCertificate}
      />

      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default Player;

