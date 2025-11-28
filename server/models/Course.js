import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  lectureId: { type: String, required: true },
  lectureTitle: { type: String, required: true },
  lectureDuration: { type: Number, required: true },
  lectureUrl: { type: String, required: true },
  isPreviewFree: { type: Boolean, required: true },
  lectureOrder: { type: Number, required: true },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  quizId: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
}, { _id: false });

const finalAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  questions: { type: [quizSchema], default: [] },
  passingScore: { type: Number, default: 70 }, // Percentage required to pass
  timeLimit: { type: Number, default: 0 }, // Time limit in minutes (0 = no limit)
}, { _id: false });

const chapterSchema = new mongoose.Schema({
  chapterId: { type: String, required: true },
  chapterOrder: { type: Number, required: true },
  chapterTitle: { type: String, required: true },
  chapterContent: { type: [lectureSchema], default: [] },
  quizzes: { type: [quizSchema], default: [] },
  finalAssessment: { type: finalAssessmentSchema, default: null },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  courseDescription: { type: String, required: true },
  courseThumbnail: { type: String },
  coursePrice: { type: Number, required: true },
  isPublished: { type: Boolean, default: true },
  discount: { type: Number, required: true, min: 0, max: 100 },
  courseContent: { type: [chapterSchema], default: [] },
  courseRatings: {
    type: [
      {
        userId: { type: String },
        rating: { type: Number, min: 0, max: 5 }
      }
    ],
    default: []
  },
  educator: { type: String, ref: 'User', required: true },
  enrolledStudents: { type: [String], ref: 'User', default: [] },
}, { timestamps: true, minimize: false });

const Course = mongoose.model('Course', courseSchema);
export default Course;
