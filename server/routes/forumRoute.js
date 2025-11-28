import express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  addComment,
  addReply,
  togglePostLike,
  toggleCommentLike,
  toggleReplyLike,
  deleteReply,
  deletePost,
  cleanupOldPosts,
} from "../controllers/forumController.js";
import upload from "../configs/multer.js";
import { protectUser } from "../middlewares/authMiddleware.js";

const forumRouter = express.Router();

forumRouter.get("/posts", getAllPosts);
forumRouter.delete("/post/:postId", protectUser, deletePost);
forumRouter.get("/post/:postId", getPostById);
forumRouter.post(
  "/create-post",
  upload.array("media", 10),
  protectUser,
  createPost
);
forumRouter.post(
  "/update-post",
  upload.array("media", 10),
  protectUser,
  updatePost
);
forumRouter.post("/add-comment", protectUser, addComment);
forumRouter.post("/add-reply", protectUser, addReply);
forumRouter.post("/toggle-post-like", protectUser, togglePostLike);
forumRouter.post("/toggle-comment-like", protectUser, toggleCommentLike);
forumRouter.post("/toggle-reply-like", protectUser, toggleReplyLike);
forumRouter.post("/delete-reply", protectUser, deleteReply);
forumRouter.post("/delete-post", protectUser, deletePost);
forumRouter.delete("/cleanup-old-posts", cleanupOldPosts);

export default forumRouter;

