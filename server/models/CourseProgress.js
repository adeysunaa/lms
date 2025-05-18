import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
    userId: {
      type: String, // <- changed from ObjectId
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lectureCompleted: {
      type: [String],
      default: []
    }
  }, { timestamps: true });
  

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
