import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  chapterId: {
    type: String,
    required: true,
  },
  quizTitle: {
    type: String,
    required: true,
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [String],
      correctAnswer: {
        type: String,
        required: true,
      },
    },
  ],
  passingScore: {
    type: Number,
    default: 70,
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30,
  },
  unlockAfterLecture: {
    type: String, // lectureId
    default: null,
  },
});

export default mongoose.model("Quiz", quizSchema);

