import ForumPost from "../models/ForumPost.js";
import { v2 as cloudinary } from "cloudinary";
import connectCloudinary from "../configs/cloudinary.js";

connectCloudinary();

export const getAllPosts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category && category !== "All" ? { category } : {};
    
    const posts = await ForumPost.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts: posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment views without saving to avoid validation errors on old data
    await ForumPost.updateOne(
      { _id: postId },
      { $inc: { views: 1 } }
    );

    // Refetch the post with updated views
    const updatedPost = await ForumPost.findById(postId);

    res.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { title, content, category, tags } = req.body;
    const mediaFiles = req.files || [];

    // Get user info from Clerk
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Upload media files to Cloudinary
    const media = [];
    for (const file of mediaFiles) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
        });

        media.push({
          url: result.secure_url,
          thumbnail: result.resource_type === "video" ? result.thumbnail_url : result.secure_url,
          type: result.resource_type === "video" ? "video" : "image",
        });
      } catch (uploadError) {
        console.error("Error uploading media:", uploadError);
      }
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map((tag) => tag.trim());
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    console.log("Creating post with user data:", {
      userId,
      userName: user.name,
      userEmail: user.email,
    });

    const post = new ForumPost({
      title,
      content,
      author: {
        id: userId,
        name: user.name || user.email || "Anonymous",
        image: user.imageUrl || "",
      },
      category,
      tags: parsedTags,
      media,
    });

    await post.save();
    console.log("Post created successfully:", post._id);

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId, content } = req.body;

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    post.comments.push({
      authorId: userId,
      authorName: user.name || user.email || "Anonymous",
      authorImage: user.imageUrl || "",
      content,
    });

    await post.save();

    // Return the updated post without populate since we're using string IDs
    const updatedPost = await ForumPost.findById(postId);

    res.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const addReply = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId, commentId, content } = req.body;

    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({
        success: false,
        message: "Comment not found",
      });
    }

    comment.replies.push({
      authorId: userId,
      authorName: user.name || user.email || "Anonymous",
      authorImage: user.imageUrl || "",
      content,
    });

    await post.save();

    const updatedPost = await ForumPost.findById(postId);

    res.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const togglePostLike = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId } = req.body;

    console.log("Toggle like request:", { userId, postId });

    const post = await ForumPost.findById(postId);

    if (!post) {
      console.log("Post not found with ID:", postId);
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      console.log("User unliked the post");
    } else {
      post.likes.push(userId);
      console.log("User liked the post");
    }

    await post.save();

    res.json({
      success: true,
      post: post,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId, commentId } = req.body;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({
        success: false,
        message: "Comment not found",
      });
    }

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      likes: comment.likes,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const cleanupOldPosts = async (req, res) => {
  try {
    // Delete all posts - use with caution!
    const result = await ForumPost.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old forum posts`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up posts:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleReplyLike = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId, commentId, replyId } = req.body;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.json({
        success: false,
        message: "Reply not found",
      });
    }

    const likeIndex = reply.likes.indexOf(userId);
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      likes: reply.likes,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId, commentId, replyId } = req.body;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.json({
        success: false,
        message: "Comment not found",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.json({
        success: false,
        message: "Reply not found",
      });
    }

    // Check if user is the author
    if (reply.authorId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    reply.deleteOne();
    await post.save();

    res.json({
      success: true,
      message: "Reply deleted",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { postId } = req.body;
    const { title, content, category, tags } = req.body;
    const mediaFiles = req.files || [];

    if (!postId) {
      return res.json({
        success: false,
        message: "Post ID is required",
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author
    if (post.author.id.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized: Only the author can edit their post",
      });
    }

    // Upload new media files to Cloudinary
    const newMedia = [];
    for (const file of mediaFiles) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
        });

        newMedia.push({
          url: result.secure_url,
          thumbnail: result.resource_type === "video" ? result.thumbnail_url : result.secure_url,
          type: result.resource_type === "video" ? "video" : "image",
        });
      } catch (uploadError) {
        console.error("Error uploading media:", uploadError);
      }
    }

    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    // Update post fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (tags !== undefined) post.tags = parsedTags;
    if (mediaFiles.length > 0) {
      // If new media is uploaded, replace existing media
      post.media = newMedia;
    }
    post.updatedAt = new Date();

    await post.save();

    res.json({
      success: true,
      post,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    console.log("Delete post endpoint called", { method: req.method, params: req.params, body: req.body });
    const userId = req.auth.userId;
    // Support both DELETE (from params) and POST (from body) methods
    const postId = req.params?.postId || req.body?.postId;

    if (!postId) {
      return res.json({
        success: false,
        message: "Post ID is required",
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the author
    if (post.author.id.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized: Only the author can delete their post",
      });
    }

    // Delete media files from Cloudinary if they exist
    if (post.media && post.media.length > 0) {
      for (const mediaItem of post.media) {
        try {
          if (mediaItem.url) {
            // Extract public_id from Cloudinary URL
            const urlParts = mediaItem.url.split('/');
            const publicIdWithExt = urlParts.slice(-2).join('/').split('.')[0];
            const resourceType = mediaItem.type === 'video' ? 'video' : 'image';
            
            await cloudinary.uploader.destroy(publicIdWithExt, {
              resource_type: resourceType,
            });
          }
        } catch (cloudinaryError) {
          console.error("Error deleting media from Cloudinary:", cloudinaryError);
          // Continue even if Cloudinary deletion fails
        }
      }
    }

    // Delete the post
    await ForumPost.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

