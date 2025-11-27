import CourseProgress from '../models/CourseProgress.js';
import Course from '../models/Course.js';
import { IssuedCertificate } from '../models/Certificate.js';
import { issueCertificate } from './certificateController.js';

// Initialize or get course progress
export const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    const { courseId } = req.params;

    let progress = await CourseProgress.findOne({ studentId, courseId });

    if (!progress) {
      // Create initial progress
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.json({
          success: false,
          message: 'Course not found',
        });
      }

      // Initialize chapter progress
      const chapters = course.courseContent.map((chapter, chapterIndex) => ({
        chapterId: `chapter-${chapterIndex}`,
        chapterTitle: chapter.chapterTitle,
        lectures: chapter.chapterContent.map((lecture, lectureIndex) => ({
          lectureId: `lecture-${chapterIndex}-${lectureIndex}`,
          completed: false,
        })),
        quizzes: (chapter.quizzes || []).map((quiz, quizIndex) => ({
          quizId: `quiz-${chapterIndex}-${quizIndex}`,
          attempts: [],
          passed: false,
          bestScore: 0,
        })),
        completed: false,
      }));

      progress = new CourseProgress({
        studentId,
        courseId,
        chapters,
        currentChapterIndex: 0,
        currentLectureIndex: 0,
      });

      await progress.save();
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Mark lecture as completed
export const completeLecture = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    const { courseId, chapterIndex, lectureIndex } = req.body;

    const progress = await CourseProgress.findOne({ studentId, courseId });

    if (!progress) {
      return res.json({
        success: false,
        message: 'Progress not found',
      });
    }

    // Check if previous content is completed (sequential learning)
    if (!canAccessContent(progress, chapterIndex, lectureIndex, 'lecture')) {
      return res.json({
        success: false,
        message: 'Please complete previous lectures first',
      });
    }

    // Mark lecture as completed
    const chapter = progress.chapters[chapterIndex];
    if (chapter && chapter.lectures[lectureIndex]) {
      chapter.lectures[lectureIndex].completed = true;
      chapter.lectures[lectureIndex].completedAt = new Date();

      // Check if all lectures in chapter are completed
      const allLecturesCompleted = chapter.lectures.every(l => l.completed);
      
      // Check if all quizzes in chapter are passed
      const allQuizzesPassed = chapter.quizzes.length === 0 || chapter.quizzes.every(q => q.passed);

      if (allLecturesCompleted && allQuizzesPassed) {
        chapter.completed = true;
        chapter.completedAt = new Date();
      }

      // Update overall progress
      progress.overallProgress = calculateOverallProgress(progress);
      progress.lastAccessedAt = new Date();

      // Update current position
      if (lectureIndex < chapter.lectures.length - 1) {
        progress.currentLectureIndex = lectureIndex + 1;
      } else if (chapterIndex < progress.chapters.length - 1) {
        progress.currentChapterIndex = chapterIndex + 1;
        progress.currentLectureIndex = 0;
      }

      await progress.save();

      // Check if course is completed
      if (progress.overallProgress === 100 && !progress.certificateIssued) {
        // Auto-issue certificate
        try {
          const certificateReq = {
            body: { courseId, studentId },
            auth: { userId: studentId },
          };
          const certificateRes = {
            json: (data) => {
              console.log('Certificate issued:', data);
            },
          };
          await issueCertificate(certificateReq, certificateRes);
          progress.completedAt = new Date();
          await progress.save();
        } catch (certError) {
          console.error('Error issuing certificate:', certError);
        }
      }

      res.json({
        success: true,
        progress,
        courseCompleted: progress.overallProgress === 100,
      });
    } else {
      res.json({
        success: false,
        message: 'Invalid lecture index',
      });
    }
  } catch (error) {
    console.error('Error completing lecture:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Submit quiz attempt
export const submitQuiz = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    const { courseId, chapterIndex, quizIndex, answers } = req.body;

    const progress = await CourseProgress.findOne({ studentId, courseId });
    const course = await Course.findById(courseId);

    if (!progress || !course) {
      return res.json({
        success: false,
        message: 'Progress or course not found',
      });
    }

    // Check if can access quiz (all lectures completed)
    const chapter = progress.chapters[chapterIndex];
    const allLecturesCompleted = chapter.lectures.every(l => l.completed);

    if (!allLecturesCompleted) {
      return res.json({
        success: false,
        message: 'Please complete all lectures before taking the quiz',
      });
    }

    // Get quiz questions
    const quizQuestions = course.courseContent[chapterIndex].quizzes[quizIndex];
    
    if (!quizQuestions) {
      return res.json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const answerDetails = answers.map((answer, index) => {
      const question = quizQuestions[index];
      const isCorrect = answer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: `q-${index}`,
        selectedAnswer: answer,
        isCorrect,
      };
    });

    const score = (correctAnswers / quizQuestions.length) * 100;
    const passingScore = 70; // 70% to pass
    const passed = score >= passingScore;

    // Save attempt
    const quizProgress = chapter.quizzes[quizIndex];
    quizProgress.attempts.push({
      score,
      totalQuestions: quizQuestions.length,
      answers: answerDetails,
      attemptedAt: new Date(),
    });

    if (passed && !quizProgress.passed) {
      quizProgress.passed = true;
    }

    quizProgress.bestScore = Math.max(quizProgress.bestScore, score);

    // Check if chapter is now complete
    const allLecturesComplete = chapter.lectures.every(l => l.completed);
    const allQuizzesPassed = chapter.quizzes.every(q => q.passed);

    if (allLecturesComplete && allQuizzesPassed) {
      chapter.completed = true;
      chapter.completedAt = new Date();
    }

    progress.overallProgress = calculateOverallProgress(progress);
    progress.lastAccessedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      score,
      passed,
      correctAnswers,
      totalQuestions: quizQuestions.length,
      progress,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to check if content can be accessed
function canAccessContent(progress, chapterIndex, contentIndex, contentType) {
  // First chapter, first lecture is always accessible
  if (chapterIndex === 0 && contentIndex === 0 && contentType === 'lecture') {
    return true;
  }

  // Check if all previous chapters are completed
  for (let i = 0; i < chapterIndex; i++) {
    if (!progress.chapters[i].completed) {
      return false;
    }
  }

  // Check if all previous lectures in current chapter are completed
  const currentChapter = progress.chapters[chapterIndex];
  if (contentType === 'lecture') {
    for (let i = 0; i < contentIndex; i++) {
      if (!currentChapter.lectures[i].completed) {
        return false;
      }
    }
  }

  // For quizzes, all lectures must be completed
  if (contentType === 'quiz') {
    return currentChapter.lectures.every(l => l.completed);
  }

  return true;
}

// Calculate overall progress percentage
function calculateOverallProgress(progress) {
  let totalItems = 0;
  let completedItems = 0;

  progress.chapters.forEach(chapter => {
    // Count lectures
    totalItems += chapter.lectures.length;
    completedItems += chapter.lectures.filter(l => l.completed).length;

    // Count quizzes
    totalItems += chapter.quizzes.length;
    completedItems += chapter.quizzes.filter(q => q.passed).length;
  });

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

// Update time spent on lecture
export const updateTimeSpent = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    const { courseId, chapterIndex, lectureIndex, timeSpent } = req.body;

    const progress = await CourseProgress.findOne({ studentId, courseId });

    if (progress) {
      const lecture = progress.chapters[chapterIndex]?.lectures[lectureIndex];
      if (lecture) {
        lecture.timeSpent = (lecture.timeSpent || 0) + timeSpent;
        progress.lastAccessedAt = new Date();
        await progress.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


