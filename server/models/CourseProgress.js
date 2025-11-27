import mongoose from 'mongoose';

const lectureProgressSchema = new mongoose.Schema({
  lectureId: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  timeSpent: {
    type: Number,
    default: 0, // in seconds
  },
});

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
  },
  attempts: [{
    score: Number,
    totalQuestions: Number,
    answers: [{
      questionId: String,
      selectedAnswer: Number,
      isCorrect: Boolean,
    }],
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  passed: {
    type: Boolean,
    default: false,
  },
  bestScore: {
    type: Number,
    default: 0,
  },
});

const chapterProgressSchema = new mongoose.Schema({
  chapterId: {
    type: String,
    required: true,
  },
  chapterTitle: String,
  lectures: [lectureProgressSchema],
  quizzes: [quizAttemptSchema],
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
});

const courseProgressSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  chapters: [chapterProgressSchema],
  overallProgress: {
    type: Number,
    default: 0, // percentage 0-100
  },
  currentChapterIndex: {
    type: Number,
    default: 0,
  },
  currentLectureIndex: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificateId: String,
}, { timestamps: true });

// Indexes for faster queries
courseProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);

export default CourseProgress;
