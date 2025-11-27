import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorImage: String,
  content: {
    type: String,
    required: true,
  },
  likes: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentSchema = new mongoose.Schema({
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorImage: String,
  content: {
    type: String,
    required: true,
  },
  likes: [{
    type: String,
  }],
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: String,
  },
  category: {
    type: String,
    required: true,
  },
  tags: [String],
  media: [
    {
      url: String,
      thumbnail: String,
      type: {
        type: String,
        enum: ["image", "video"],
      },
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  likes: [String],
  comments: [commentSchema],
  isPinned: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ForumPost", forumPostSchema);

