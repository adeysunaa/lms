import Quiz from "../models/Quiz.js";

export const getQuiz = async (req, res) => {
  try {
    const { courseId, chapterId, quizId } = req.body;

    const quiz = await Quiz.findOne({
      courseId,
      chapterId,
      quizId,
    });

    if (!quiz) {
      return res.json({
        success: false,
        message: "Quiz not found",
      });
    }

    res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, chapterId, quizId, answers } = req.body;

    const quiz = await Quiz.findOne({
      courseId,
      chapterId,
      quizId,
    });

    if (!quiz) {
      return res.json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * 100;
    const passed = score >= quiz.passingScore;

    // Update user progress
    const User = (await import("../models/User.js")).default;
    const CourseProgress = (await import("../models/CourseProgress.js")).default;

    let progress = await CourseProgress.findOne({
      userId,
      courseId,
    });

    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        quizPassed: [],
      });
    }

    if (passed && !progress.quizPassed.includes(quizId)) {
      progress.quizPassed.push(quizId);
      await progress.save();
    }

    res.json({
      success: true,
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

