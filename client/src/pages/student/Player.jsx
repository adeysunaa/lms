import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import CertificateModal from "../../components/student/CertificateModal";
import SecureQuizWrapper from "../../components/student/SecureQuizWrapper";
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
  const [showRatingSection, setShowRatingSection] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Final Assessment state
  const [showFinalAssessment, setShowFinalAssessment] = useState(false);
  const [currentFinalAssessment, setCurrentFinalAssessment] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState([]);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [currentAssessmentQuestionIndex, setCurrentAssessmentQuestionIndex] = useState(0);
  
  // Video tracking state
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualWatchTime, setActualWatchTime] = useState(0); // Total seconds actually watched
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTimeInterval, setWatchTimeInterval] = useState(null);
  const lastBackendUpdateRef = useRef(Date.now());
  const accumulatedSecondsRef = useRef(0);

  // Auto-expand rating section if user hasn't rated yet
  useEffect(() => {
    if (initialRating === 0) {
      setShowRatingSection(true);
    }
  }, [initialRating]);

  // Tab visibility API - pause video when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && youtubePlayer && isPlaying) {
        youtubePlayer.pauseVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [youtubePlayer, isPlaying]);

  // Track actual watch time (capped at video duration)
  useEffect(() => {
    if (isPlaying && youtubePlayer && videoDuration > 0) {
      const interval = setInterval(() => {
        setActualWatchTime(prev => {
          // Cap watch time at video duration (100%)
          if (prev >= videoDuration) {
            return prev; // Don't increment beyond 100%
          }
          
          const newTime = prev + 1;
          accumulatedSecondsRef.current += 1;
          
          // Update backend every 10 seconds (only if not at cap)
          const now = Date.now();
          if (now - lastBackendUpdateRef.current >= 10000 && playerData && newTime < videoDuration) {
            const secondsToUpdate = accumulatedSecondsRef.current;
            updateWatchTimeInBackend(secondsToUpdate);
            accumulatedSecondsRef.current = 0;
            lastBackendUpdateRef.current = now;
          }
          
          // Cap at video duration
          return Math.min(newTime, videoDuration);
        });
      }, 1000);

      setWatchTimeInterval(interval);
      return () => {
        clearInterval(interval);
        setWatchTimeInterval(null);
      };
    } else {
      // Save any accumulated time when paused
      if (accumulatedSecondsRef.current > 0 && playerData) {
        updateWatchTimeInBackend(accumulatedSecondsRef.current);
        accumulatedSecondsRef.current = 0;
      }
      if (watchTimeInterval) {
        clearInterval(watchTimeInterval);
        setWatchTimeInterval(null);
      }
    }
  }, [isPlaying, youtubePlayer, playerData, videoDuration]);

  // Load existing watch time when lecture changes
  useEffect(() => {
    if (playerData && progress) {
      const lecture = progress.chapters[playerData.chapterIndex]?.lectures[playerData.lectureIndex];
      if (lecture && lecture.timeSpent) {
        // Cap loaded watch time at video duration when video is ready
        const loadedTime = lecture.timeSpent;
        setActualWatchTime(loadedTime);
      } else {
        setActualWatchTime(0);
      }
      // Reset video tracking
      setCurrentTime(0);
      setVideoDuration(0);
      setYoutubePlayer(null);
      accumulatedSecondsRef.current = 0;
      lastBackendUpdateRef.current = Date.now();
    }
  }, [playerData?.chapterIndex, playerData?.lectureIndex, progress]);

  // Cap watch time when video duration is available
  useEffect(() => {
    if (videoDuration > 0 && actualWatchTime > videoDuration) {
      setActualWatchTime(videoDuration);
    }
  }, [videoDuration, actualWatchTime]);

  // Save watch time when component unmounts or lecture changes
  useEffect(() => {
    return () => {
      if (playerData && accumulatedSecondsRef.current > 0) {
        updateWatchTimeInBackend(accumulatedSecondsRef.current);
      }
      if (watchTimeInterval) {
        clearInterval(watchTimeInterval);
      }
    };
  }, [playerData]);

  const updateWatchTimeInBackend = async (increment = 10) => {
    if (!playerData) return;
    
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/progress/update-time`,
        {
          courseId,
          chapterIndex: playerData.chapterIndex,
          lectureIndex: playerData.lectureIndex,
          timeSpent: increment, // Increment by seconds watched
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to update watch time:', error);
    }
  };

  // YouTube player event handlers
  const timeTrackingIntervalRef = useRef(null);
  
  const handlePlayerReady = (event) => {
    const player = event.target;
    setYoutubePlayer(player);
    
    // Get video duration
    const duration = player.getDuration();
    setVideoDuration(duration);
    
    // Cap existing watch time at video duration
    setActualWatchTime(prev => {
      if (duration > 0 && prev > duration) {
        return duration;
      }
      return prev;
    });
    
    // Clear any existing interval
    if (timeTrackingIntervalRef.current) {
      clearInterval(timeTrackingIntervalRef.current);
    }
    
    // Set up interval to track current time
    const timeInterval = setInterval(() => {
      try {
        const current = player.getCurrentTime();
        setCurrentTime(current);
      } catch (e) {
        // Player might not be ready
      }
    }, 500);

    timeTrackingIntervalRef.current = timeInterval;
  };

  const handleStateChange = (event) => {
    const state = event.data;
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    const wasPlaying = isPlaying;
    setIsPlaying(state === 1);
    
    if (state === 0) { // Video ended
      // Save any remaining watch time
      if (playerData && wasPlaying) {
        updateWatchTimeInBackend(1);
      }
    } else if (state === 2 && wasPlaying) { // Paused
      // Save watch time when paused
      if (playerData) {
        updateWatchTimeInBackend(1);
      }
    }
  };

  // Cleanup time interval when player is destroyed or lecture changes
  useEffect(() => {
    return () => {
      if (timeTrackingIntervalRef.current) {
        clearInterval(timeTrackingIntervalRef.current);
        timeTrackingIntervalRef.current = null;
      }
    };
  }, [playerData?.chapterIndex, playerData?.lectureIndex]);

  // Check if watch time requirement is met (e.g., 80% of video duration)
  const isWatchTimeRequirementMet = () => {
    if (!videoDuration || videoDuration === 0) return false;
    const cappedWatchTime = Math.min(actualWatchTime, videoDuration);
    const requiredWatchTime = videoDuration * 0.8; // 80% requirement
    return cappedWatchTime >= requiredWatchTime;
  };

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

  const canAccessFinalAssessment = (chapterIndex) => {
    if (!progress || !courseData) return false;
    
    const currentChapter = progress.chapters[chapterIndex];
    if (!currentChapter) return false;

    // All lectures must be completed
    const allLecturesCompleted = currentChapter.lectures.every(l => l.completed);
    
    // All quizzes must be passed
    const chapterData = courseData.courseContent[chapterIndex];
    const allQuizzesPassed = !chapterData.quizzes || chapterData.quizzes.length === 0 || 
      chapterData.quizzes.every((_, idx) => isQuizPassed(chapterIndex, idx));

    return allLecturesCompleted && allQuizzesPassed;
  };

  const isFinalAssessmentPassed = (chapterIndex) => {
    if (!progress) return false;
    const chapter = progress.chapters[chapterIndex];
    if (!chapter) return false;
    return chapter.finalAssessment?.passed || false;
  };

  // Check if all final assessments are passed (required for certificate)
  const areAllFinalAssessmentsPassed = () => {
    if (!progress || !courseData) return true; // If no data, assume passed (backwards compatibility)
    
    // Check each chapter
    for (let i = 0; i < courseData.courseContent.length; i++) {
      const chapterData = courseData.courseContent[i];
      const chapterProgress = progress.chapters[i];
      
      // If course has a final assessment for this chapter
      if (chapterData?.finalAssessment) {
        // Progress must show it as passed
        if (!chapterProgress?.finalAssessment?.passed) {
          return false;
        }
      }
    }
    
    return true;
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

    // Get all quizzes from the chapter - each quiz is one question
    const quizzes = courseData.courseContent[chapterIndex].quizzes;
    
    // Filter out any undefined/null quizzes
    const validQuizzes = quizzes.filter(q => q && q.question && q.options && q.correctAnswer !== undefined);
    
    if (validQuizzes.length === 0) {
      toast.error('No valid quizzes found for this chapter');
      return;
    }
    
    setCurrentQuiz({ questions: validQuizzes, chapterIndex, quizIndex: 0 });
    setQuizAnswers(new Array(validQuizzes.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowQuiz(true);
    setQuizResult(null);
    setPlayerData(null);
    setShowFinalAssessment(false);
    setAssessmentResult(null);
  };

  const handleFinalAssessmentClick = (chapterIndex) => {
    if (!canAccessFinalAssessment(chapterIndex)) {
      toast.warning('Please complete all lectures and pass all quizzes before taking the final assessment');
      return;
    }

    const chapter = courseData.courseContent[chapterIndex];
    if (!chapter.finalAssessment || !chapter.finalAssessment.questions || chapter.finalAssessment.questions.length === 0) {
      toast.error('No final assessment found for this chapter');
      return;
    }

    setCurrentFinalAssessment({
      ...chapter.finalAssessment,
      chapterIndex,
    });
    setAssessmentAnswers(new Array(chapter.finalAssessment.questions.length).fill(null));
    setCurrentAssessmentQuestionIndex(0);
    setShowFinalAssessment(true);
    setAssessmentResult(null);
    setPlayerData(null);
    setShowQuiz(false);
    setQuizResult(null);
  };

  const handleAssessmentAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...assessmentAnswers];
    newAnswers[questionIndex] = answerIndex;
    setAssessmentAnswers(newAnswers);
  };

  const handleSubmitFinalAssessment = async () => {
    if (!currentFinalAssessment) return;

    // Check if all questions are answered
    if (assessmentAnswers.some(answer => answer === null)) {
      toast.warning('Please answer all questions before submitting');
      return;
    }

    try {
      const token = await getToken();
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = currentFinalAssessment.questions.length;
      
      currentFinalAssessment.questions.forEach((question, index) => {
        if (assessmentAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= (currentFinalAssessment.passingScore || 70);

      // Submit to backend
      const { data } = await axios.post(
        `${backendUrl}/api/progress/submit-final-assessment`,
        {
          courseId,
          chapterIndex: currentFinalAssessment.chapterIndex,
          answers: assessmentAnswers,
          score,
          passed,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAssessmentResult({ score, passed, correctAnswers, totalQuestions });
        setProgress(data.progress);
        
        if (passed) {
          toast.success(`Final Assessment passed! Score: ${score}%`);
        } else {
          toast.error(`Final Assessment failed. Score: ${score}%. You need ${currentFinalAssessment.passingScore || 70}% to pass.`);
        }

        // Check if course is completed AND assessment was passed
        if (data.courseCompleted && passed) {
          toast.success('🎉 Congratulations! You completed the course!');
          
          const certData = await axios.get(
            `${backendUrl}/api/certificate/my-certificates`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (certData.data.success && certData.data.certificates.length > 0) {
            const courseCert = certData.data.certificates.find(
              c => c.courseId._id === courseId || c.courseId === courseId
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
      console.error('Final assessment submission error:', error);
      toast.error('Failed to submit final assessment');
    }
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

        // Check if course is completed after passing quiz
        if (data.courseCompleted) {
          toast.success('🎉 Congratulations! You completed the course!');
          
          // Fetch certificate
          const certData = await axios.get(
            `${backendUrl}/api/certificate/my-certificates`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (certData.data.success && certData.data.certificates.length > 0) {
            const courseCert = certData.data.certificates.find(
              c => c.courseId._id === courseId || c.courseId === courseId
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
      toast.error('Failed to submit quiz');
      console.error('Quiz submission error:', error);
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
        <div className="text-white pt-8">
          <h2 className="h3 text-white mb-6">Course Structure</h2>

          <div className="space-y-4">
            {courseData.courseContent.map((chapter, chapterIndex) => (
              <div
                key={chapterIndex}
                className="glass-card rounded-2xl overflow-hidden border border-white/20"
              >
                <div
                  className="flex items-center justify-between px-6 py-5 cursor-pointer select-none hover:bg-white/5 transition-colors"
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
                  <ul className="px-4 pb-5 pt-3 space-y-2 border-t border-white/10">
                    {/* Lectures */}
                    {chapter.chapterContent.map((lecture, lectureIndex) => {
                      const isAccessible = canAccessLecture(chapterIndex, lectureIndex);
                      const isCompleted = isLectureCompleted(chapterIndex, lectureIndex);

                      return (
                        <li
                          key={lectureIndex}
                          className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl transition-all ${
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
                              <i className="ri-checkbox-circle-fill text-green-400 text-xl flex-shrink-0"></i>
                            ) : (
                              <i className="ri-play-circle-line text-xl text-white flex-shrink-0"></i>
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
                      <li
                        className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl transition-all mt-2 pt-2 border-t border-white/20 ${
                          canAccessQuiz(chapterIndex)
                            ? 'hover:bg-white/10 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        } ${
                          showQuiz &&
                          currentQuiz?.chapterIndex === chapterIndex
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-0 border-r-0 border-b-0 border-t border-blue-400/30'
                            : ''
                        }`}
                        onClick={() => handleQuizClick(chapterIndex, 0)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {(() => {
                            const quizPassed = chapter.quizzes.some((q, idx) => isQuizPassed(chapterIndex, idx));
                            return quizPassed ? (
                              <i className="ri-checkbox-circle-fill text-green-400 text-xl flex-shrink-0"></i>
                            ) : (
                              <i className="ri-questionnaire-line text-purple-400 text-xl flex-shrink-0"></i>
                            );
                          })()}
                          <div className="min-w-0 flex-1">
                            <p className="body-small font-medium text-white truncate">
                              Chapter Quiz
                            </p>
                            <p className="text-xs text-white/60 mt-0.5">
                              {(() => {
                                const validQuizzes = chapter.quizzes.filter(q => q && q.question && q.options && q.correctAnswer !== undefined);
                                const totalQuestions = validQuizzes.length;
                                return `${totalQuestions} ${totalQuestions === 1 ? 'question' : 'questions'}`;
                              })()}
                            </p>
                          </div>
                          {!canAccessQuiz(chapterIndex) && (
                            <i className="ri-lock-line text-yellow-400 text-sm flex-shrink-0" title="Complete all lectures first"></i>
                          )}
                        </div>
                        <div className="flex items-center gap-2 body-small text-white/70 flex-shrink-0">
                          {(() => {
                            const quizPassed = chapter.quizzes.some((q, idx) => isQuizPassed(chapterIndex, idx));
                            return quizPassed ? (
                              <span className="px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-400/30">
                                Passed
                              </span>
                            ) : (
                              <span className="text-xs text-white/60">70% to pass</span>
                            );
                          })()}
                        </div>
                      </li>
                    )}

                    {/* Final Assessment */}
                    {chapter.finalAssessment && (
                      <li
                        className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl transition-all ${
                          chapter.quizzes && chapter.quizzes.length > 0 
                            ? 'mt-2' 
                            : 'mt-2 pt-2 border-t border-white/20'
                        } ${
                          canAccessFinalAssessment(chapterIndex)
                            ? 'hover:bg-white/10 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        } ${
                          showFinalAssessment &&
                          currentFinalAssessment?.chapterIndex === chapterIndex
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30'
                            : ''
                        }`}
                        onClick={() => handleFinalAssessmentClick(chapterIndex)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isFinalAssessmentPassed(chapterIndex) ? (
                            <i className="ri-checkbox-circle-fill text-green-400 text-xl flex-shrink-0"></i>
                          ) : (
                            <i className="ri-file-list-3-line text-orange-400 text-xl flex-shrink-0"></i>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="body-small font-medium text-white truncate">
                              {chapter.finalAssessment.title || 'Final Assessment'}
                            </p>
                            <p className="text-xs text-white/60 mt-0.5">
                              {chapter.finalAssessment.questions?.length || 0} {chapter.finalAssessment.questions?.length === 1 ? 'question' : 'questions'}
                              {chapter.finalAssessment.timeLimit > 0 && ` • ${chapter.finalAssessment.timeLimit} min`}
                            </p>
                          </div>
                          {!canAccessFinalAssessment(chapterIndex) && (
                            <i className="ri-lock-line text-yellow-400 text-sm flex-shrink-0" title="Complete all lectures and quizzes first"></i>
                          )}
                        </div>
                        <div className="flex items-center gap-2 body-small text-white/70 flex-shrink-0">
                          {isFinalAssessmentPassed(chapterIndex) ? (
                            <span className="px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-400/30">
                              Passed
                            </span>
                          ) : (
                            <span className="text-xs text-white/60">
                              {chapter.finalAssessment.passingScore || 70}% to pass
                            </span>
                          )}
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          {progress && (
            <div className="glass-card rounded-2xl p-6 mt-6 border border-white/20">
              <h3 className="h5 text-white mb-5 flex items-center gap-2">
                <i className="ri-progress-line text-blue-400 text-xl"></i>
                Your Progress
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-white/80 mb-3">
                    <span className="body-small">Overall Completion</span>
                    <span className="font-semibold text-white">{progress.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress.overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                {progress.certificateIssued && areAllFinalAssessmentsPassed() && (
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <i className="ri-trophy-line text-xl"></i>
                    View Certificate
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rating Section - Moved to left column to avoid blocking button */}
          <div className="glass-card rounded-2xl overflow-hidden border border-white/20 mt-6">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setShowRatingSection(!showRatingSection)}
            >
              <div className="flex items-center gap-2">
                <i className="ri-star-line text-yellow-400 text-xl"></i>
                <h3 className="h5 text-white">Rate This Course</h3>
                {initialRating > 0 && (
                  <span className="text-xs text-white/60 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-400/30">
                    Rated {initialRating}/5
                  </span>
                )}
              </div>
              <i
                className={`ri-arrow-down-s-line text-xl text-white/60 transform transition-transform ${
                  showRatingSection ? "rotate-180" : ""
                }`}
              ></i>
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                showRatingSection ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-4 pt-2 border-t border-white/10">
                <Rating initialRating={initialRating} onRate={handleRate} />
                {initialRating > 0 && (
                  <p className="text-xs text-white/60 mt-2">
                    Thank you for your rating!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Video Player / Quiz */}
        <div>
          {showQuiz && currentQuiz ? (
            // Quiz View - Secured
            <SecureQuizWrapper isActive={!quizResult}>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 sticky top-24">
              {!quizResult && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-300 text-xs">
                    <i className="ri-shield-check-line text-base"></i>
                    <span className="font-semibold">Security Active:</span>
                    <span>All exam activity is monitored and logged. Screenshots are watermarked with your information and timestamp. Unauthorized sharing will result in exam disqualification.</span>
                  </div>
                </div>
              )}
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
                {!quizResult && currentQuiz.questions.length > 0 ? (
                  // Show one question at a time
                  (() => {
                    const question = currentQuiz.questions[currentQuestionIndex];
                    if (!question || !question.options) return null;
                    
                    return (
                      <div
                        key={currentQuestionIndex}
                        className="glass-light rounded-xl p-5 border border-white/20"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p 
                            className="font-semibold text-white body"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                          >
                            {currentQuestionIndex + 1}. {question.question}
                          </p>
                          <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                            Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => {
                            const isSelected = quizAnswers[currentQuestionIndex] === oIndex;

                            return (
                              <label
                                key={oIndex}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                  isSelected
                                    ? 'bg-blue-500/20 border-blue-400/50'
                                    : 'border-white/20 hover:bg-white/5'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestionIndex}`}
                                  checked={isSelected}
                                  onChange={() => handleQuizAnswerChange(currentQuestionIndex, oIndex)}
                                  className="w-4 h-4 accent-blue-500"
                                />
                                <span 
                                  className="text-white body-small flex-1"
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                                >
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        
                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentQuestionIndex === 0
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <i className="ri-arrow-left-line mr-2"></i>
                            Previous
                          </button>
                          
                          <div className="flex gap-2">
                            {currentQuiz.questions.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                  idx === currentQuestionIndex
                                    ? 'bg-blue-500 text-white'
                                    : quizAnswers[idx] !== null
                                    ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex(Math.min(currentQuiz.questions.length - 1, currentQuestionIndex + 1))}
                            disabled={currentQuestionIndex === currentQuiz.questions.length - 1}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              currentQuestionIndex === currentQuiz.questions.length - 1
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            Next
                            <i className="ri-arrow-right-line ml-2"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : quizResult ? (
                  // Show all questions with results after submission
                  currentQuiz.questions.filter(q => q).map((question, qIndex) => {
                    if (!question || !question.options) return null;
                    
                    return (
                      <div
                        key={qIndex}
                        className="glass-light rounded-xl p-5 border border-white/20"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      >
                        <p 
                          className="font-semibold text-white mb-4 body"
                          style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                        >
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
                                  isCorrect
                                    ? 'bg-green-500/20 border-green-400/50'
                                    : isWrong
                                    ? 'bg-red-500/20 border-red-400/50'
                                    : 'border-white/10'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  checked={isSelected}
                                  disabled
                                  className="w-4 h-4 accent-blue-500"
                                />
                                <span 
                                  className="text-white body-small flex-1"
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                                >
                                  {option}
                                </span>
                                {isCorrect && (
                                  <i className="ri-check-line text-green-400"></i>
                                )}
                                {isWrong && (
                                  <i className="ri-close-line text-red-400"></i>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : null}
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
            </SecureQuizWrapper>
          ) : showFinalAssessment && currentFinalAssessment ? (
            // Final Assessment View - Secured
            <SecureQuizWrapper isActive={!assessmentResult}>
              <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 sticky top-24">
                {!assessmentResult && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                    <div className="flex items-center gap-2 text-red-300 text-xs">
                      <i className="ri-shield-check-line text-base"></i>
                      <span className="font-semibold">Security Active:</span>
                      <span>All exam activity is monitored and logged. Screenshots are watermarked with your information and timestamp. Unauthorized sharing will result in exam disqualification.</span>
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <i className="ri-file-list-3-line text-white text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="h4 text-white">{currentFinalAssessment.title}</h3>
                      <p className="body-small text-white/70">
                        {currentFinalAssessment.questions?.length || 0} questions • {currentFinalAssessment.passingScore || 70}% to pass
                        {currentFinalAssessment.timeLimit > 0 && ` • ${currentFinalAssessment.timeLimit} minutes`}
                      </p>
                    </div>
                  </div>

                  {currentFinalAssessment.description && (
                    <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-sm text-white/80">{currentFinalAssessment.description}</p>
                    </div>
                  )}

                  {assessmentResult && (
                    <div
                      className={`rounded-xl p-4 mb-4 border ${
                        assessmentResult.passed
                          ? 'bg-green-500/20 border-green-400/30'
                          : 'bg-red-500/20 border-red-400/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <i
                          className={`text-3xl ${
                            assessmentResult.passed
                              ? 'ri-checkbox-circle-fill text-green-400'
                              : 'ri-close-circle-fill text-red-400'
                          }`}
                        ></i>
                        <div>
                          <p className="font-semibold text-white">
                            {assessmentResult.passed ? 'Final Assessment Passed!' : 'Final Assessment Failed'}
                          </p>
                          <p className="text-sm text-white/80">
                            Score: {assessmentResult.score}% ({assessmentResult.correctAnswers}/{assessmentResult.totalQuestions} correct)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                  {!assessmentResult && currentFinalAssessment.questions && currentFinalAssessment.questions.length > 0 ? (
                    // Show one question at a time
                    (() => {
                      const question = currentFinalAssessment.questions[currentAssessmentQuestionIndex];
                      if (!question || !question.options) return null;
                      
                      return (
                        <div
                          key={currentAssessmentQuestionIndex}
                          className="glass-light rounded-xl p-5 border border-white/20"
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p 
                              className="font-semibold text-white body"
                              style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                            >
                              {currentAssessmentQuestionIndex + 1}. {question.question}
                            </p>
                            <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                              Question {currentAssessmentQuestionIndex + 1} of {currentFinalAssessment.questions.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => {
                              const isSelected = assessmentAnswers[currentAssessmentQuestionIndex] === oIndex;

                              return (
                                <label
                                  key={oIndex}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                    isSelected
                                      ? 'bg-blue-500/20 border-blue-400/50'
                                      : 'border-white/20 hover:bg-white/5'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`assessment-question-${currentAssessmentQuestionIndex}`}
                                    checked={isSelected}
                                    onChange={() => handleAssessmentAnswerChange(currentAssessmentQuestionIndex, oIndex)}
                                    className="w-4 h-4 accent-blue-500"
                                  />
                                  <span 
                                    className="text-white body-small flex-1"
                                    style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                                  >
                                    {option}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          
                          {/* Navigation buttons */}
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() => setCurrentAssessmentQuestionIndex(Math.max(0, currentAssessmentQuestionIndex - 1))}
                              disabled={currentAssessmentQuestionIndex === 0}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentAssessmentQuestionIndex === 0
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              <i className="ri-arrow-left-line mr-2"></i>
                              Previous
                            </button>
                            
                            <div className="flex gap-2">
                              {currentFinalAssessment.questions.map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setCurrentAssessmentQuestionIndex(idx)}
                                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                    idx === currentAssessmentQuestionIndex
                                      ? 'bg-blue-500 text-white'
                                      : assessmentAnswers[idx] !== null
                                      ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setCurrentAssessmentQuestionIndex(Math.min(currentFinalAssessment.questions.length - 1, currentAssessmentQuestionIndex + 1))}
                              disabled={currentAssessmentQuestionIndex === currentFinalAssessment.questions.length - 1}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                currentAssessmentQuestionIndex === currentFinalAssessment.questions.length - 1
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              Next
                              <i className="ri-arrow-right-line ml-2"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : assessmentResult ? (
                    // Show all questions with results after submission
                    currentFinalAssessment.questions.filter(q => q).map((question, qIndex) => {
                      if (!question || !question.options) return null;
                      
                      return (
                        <div
                          key={qIndex}
                          className="glass-light rounded-xl p-5 border border-white/20"
                          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                        >
                          <p 
                            className="font-semibold text-white mb-4 body"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                          >
                            {qIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => {
                              const isSelected = assessmentAnswers[qIndex] === oIndex;
                              const isCorrect = assessmentResult && question.correctAnswer === oIndex;
                              const isWrong = assessmentResult && isSelected && question.correctAnswer !== oIndex;

                              return (
                                <label
                                  key={oIndex}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                    isCorrect
                                      ? 'bg-green-500/20 border-green-400/50'
                                      : isWrong
                                      ? 'bg-red-500/20 border-red-400/50'
                                      : 'border-white/10'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`assessment-result-${qIndex}`}
                                    checked={isSelected}
                                    disabled
                                    className="w-4 h-4 accent-blue-500"
                                  />
                                  <span 
                                    className="text-white body-small flex-1"
                                    style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }}
                                  >
                                    {option}
                                  </span>
                                  {isCorrect && (
                                    <i className="ri-check-line text-green-400"></i>
                                  )}
                                  {isWrong && (
                                    <i className="ri-close-line text-red-400"></i>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : null}
                </div>

                {!assessmentResult && (
                  <button
                    onClick={handleSubmitFinalAssessment}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="ri-send-plane-line"></i>
                    Submit Final Assessment
                  </button>
                )}
              </div>
            </SecureQuizWrapper>
          ) : playerData ? (
            // Video Player
            <div className="glass-card rounded-2xl overflow-hidden border border-white/20 sticky top-24">
              <div className="relative">
                <YouTube
                  videoId={playerData.videoId}
                  opts={{
                    width: "100%",
                    playerVars: { autoplay: 1 },
                  }}
                  className="aspect-video w-full"
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                />
              </div>

              <div className="p-6">
                <h3 className="h4 text-white mb-4">{playerData.title}</h3>

                {/* Dual Progress Bars */}
                <div className="mb-6 space-y-3">
                  {/* Video Timeline Position */}
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-1.5">
                      <span className="font-medium">Video Timeline</span>
                      <span>
                        {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400/70 via-indigo-400/70 to-blue-400/70 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/20"
                        style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actual Watch Time */}
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-1.5">
                      <span className="font-medium">Watch Time</span>
                      <span>
                        {(() => {
                          const cappedWatchTime = videoDuration > 0 ? Math.min(actualWatchTime, videoDuration) : actualWatchTime;
                          const displayTime = Math.floor(cappedWatchTime / 60);
                          const displaySeconds = Math.floor(cappedWatchTime % 60);
                          const displayDuration = Math.floor(videoDuration / 60);
                          const displayDurationSeconds = Math.floor(videoDuration % 60);
                          const percentage = videoDuration > 0 ? Math.min(100, Math.round((cappedWatchTime / videoDuration) * 100)) : 0;
                          
                          return (
                            <>
                              {displayTime}:{displaySeconds.toString().padStart(2, '0')} / {displayDuration}:{displayDurationSeconds.toString().padStart(2, '0')}
                              {videoDuration > 0 && (
                                <span className="ml-2 text-cyan-300/90 font-semibold">
                                  ({percentage}%)
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400/70 via-teal-400/70 to-emerald-400/70 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/20"
                        style={{ width: `${(() => {
                          const cappedWatchTime = videoDuration > 0 ? Math.min(actualWatchTime, videoDuration) : actualWatchTime;
                          return videoDuration > 0 ? Math.min(100, (cappedWatchTime / videoDuration) * 100) : 0;
                        })()}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Watch Time Requirement Indicator */}
                  {videoDuration > 0 && !isWatchTimeRequirementMet() && (
                    <div className="text-xs text-cyan-300/90 bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
                      <i className="ri-information-line mr-1"></i>
                      Watch at least 80% of the video to mark as completed ({Math.min(100, Math.round((Math.min(actualWatchTime, videoDuration) / videoDuration) * 100))}% watched)
                    </div>
                  )}
                </div>

                {!isLectureCompleted(playerData.chapterIndex, playerData.lectureIndex) && (
                  <button
                    onClick={handleCompleteLecture}
                    disabled={!isWatchTimeRequirementMet()}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isWatchTimeRequirementMet()
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 cursor-pointer hover:scale-105 border border-white/30"
                        : "bg-white/10 text-white/50 cursor-not-allowed border border-white/20"
                    }`}
                  >
                    <i className="ri-checkbox-circle-line text-xl"></i>
                    {isWatchTimeRequirementMet() ? "Mark as Completed" : "Complete Required Watch Time"}
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

