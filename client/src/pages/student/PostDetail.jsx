import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/student/Navbar";
import Footer from "../../components/student/Footer";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, getToken } = useContext(AppContext);
  const { user } = useUser();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [replyContent, setReplyContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "General",
    tags: "",
    mediaFiles: [],
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const categories = [
    { value: "General", icon: "ri-chat-1-line", color: "from-blue-400 to-cyan-400" },
    { value: "Questions", icon: "ri-question-line", color: "from-purple-400 to-pink-400" },
    { value: "Announcements", icon: "ri-megaphone-line", color: "from-orange-400 to-red-400" },
    { value: "Help", icon: "ri-hand-heart-line", color: "from-green-400 to-emerald-400" },
    { value: "Feedback", icon: "ri-feedback-line", color: "from-yellow-400 to-amber-400" },
  ];

  useEffect(() => {
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likes.includes(user.id));
    }
  }, [post, user]);

  // Initialize Quill editor when edit modal opens
  useEffect(() => {
    if (showEditModal && editorRef.current) {
      if (!quillRef.current) {
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image"],
              ["clean"],
            ],
          },
        });
        quillRef.current.on("text-change", () => {
          setEditForm((prev) => ({ ...prev, content: quillRef.current.root.innerHTML }));
        });
      }
      
      // Set content when modal opens
      if (post && quillRef.current) {
        quillRef.current.root.innerHTML = post.content || "";
        setEditForm((prev) => ({ ...prev, content: post.content || "" }));
      }
    }
  }, [showEditModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/forum/post/${postId}`);
      if (data.success) {
        setPost(data.post);
      }
    } catch (error) {
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.warn("Please login to like this post");
      return;
    }

    try {
      const token = await getToken();
      console.log("Liking post with ID:", postId);
      const { data } = await axios.post(
        `${backendUrl}/api/forum/toggle-post-like`,
        { postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Like response:", data);
      
      if (data.success) {
        setPost(data.post);
        setIsLiked(!isLiked);
        toast.success(isLiked ? "Post unliked" : "Post liked");
      } else {
        toast.error(data.message || "Failed to like post");
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error(error.response?.data?.message || "Failed to like post");
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this post: ${post.title}`;
    
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        setShowShareMenu(false);
        return;
      default:
        return;
    }
    
    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const handleEditPost = () => {
    if (!post) return;
    
    setEditForm({
      title: post.title || "",
      content: post.content || "",
      category: post.category || "General",
      tags: post.tags ? post.tags.join(", ") : "",
      mediaFiles: [],
    });
    setShowEditModal(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("postId", postId);
      formData.append("title", editForm.title);
      formData.append("content", quillRef.current ? quillRef.current.root.innerHTML : editForm.content);
      formData.append("category", editForm.category);
      formData.append("tags", JSON.stringify(editForm.tags.split(",").map((t) => t.trim()).filter(Boolean)));

      editForm.mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const { data } = await axios.post(
        `${backendUrl}/api/forum/update-post`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success("Post updated successfully!");
        setPost(data.post);
        setShowEditModal(false);
        setEditForm({
          title: "",
          content: "",
          category: "General",
          tags: "",
          mediaFiles: [],
        });
      } else {
        toast.error(data.message || "Failed to update post");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update post");
      console.error("Post update error:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/forum/delete-post`,
        { postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Post deleted successfully");
        navigate("/forum");
      } else {
        toast.error(data.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/forum/add-comment`,
        { postId, content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setPost(data.post);
        setComment("");
        toast.success("Comment added");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleAddReply = async (commentId) => {
    const content = replyContent[commentId];
    if (!content || !content.trim()) return;

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/forum/add-reply`,
        { postId, commentId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setPost(data.post);
        setReplyContent({ ...replyContent, [commentId]: "" });
        toast.success("Reply added");
      }
    } catch (error) {
      toast.error("Failed to add reply");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
          <div className="text-center text-white/60">
            <i className="ri-loader-4-line text-4xl animate-spin"></i>
            <p className="mt-4">Loading post...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
          <div className="text-center text-white/60">
            <i className="ri-error-warning-line text-6xl mb-4"></i>
            <p>Post not found</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-20 pb-10 px-4 md:px-8 lg:px-36">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/forum")}
            className="mb-6 glass-light px-4 py-2 rounded-xl text-white hover:bg-white/20 flex items-center gap-2 transition-all w-fit border border-white/20"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Forum
          </button>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl mb-6">
            <div className="flex items-center gap-4 mb-4">
              {post.author.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{post.author.name}</h3>
                  {user && user.id === post.author.id && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-400/30">
                      Author
                    </span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{post.title}</h1>

            {post.media && post.media.length > 0 && (
              <div className="mb-4 space-y-2">
                {post.media.map((media, idx) => (
                  <div key={idx}>
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt=""
                        className="w-full rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <video src={media.url} controls className="w-full rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              className="text-white/90 leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl text-sm text-white/80 border border-white/10 hover:border-white/30 transition-all"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-white/70 body-small">
                <div className="flex items-center gap-2">
                  <i className="ri-eye-line"></i>
                  <span>{post.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-chat-3-line"></i>
                  <span>{post.comments.length} comments</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Edit and Delete Buttons - Only show for author */}
                {user && user.id === post.author.id && (
                  <>
                    <button
                      onClick={handleEditPost}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all border glass-light text-blue-400 border-blue-400/30 hover:bg-blue-500/10 hover:border-blue-400/50"
                      title="Edit post"
                    >
                      <i className="ri-edit-line text-lg"></i>
                      <span className="font-medium">Edit</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all border glass-light text-red-400 border-red-400/30 hover:bg-red-500/10 hover:border-red-400/50"
                      title="Delete post"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                      <span className="font-medium">Delete</span>
                    </button>
                  </>
                )}

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
                    isLiked
                      ? "bg-gradient-to-r from-pink-500 to-red-500 text-white border-transparent shadow-lg"
                      : "glass-light text-white border-white/20 hover:border-white/40"
                  }`}
                >
                  <i className={`${isLiked ? "ri-heart-fill" : "ri-heart-line"} text-lg`}></i>
                  <span className="font-medium">{post.likes.length}</span>
                </button>

                {/* Share Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light text-white border border-white/20 hover:border-white/40 transition-all"
                  >
                    <i className="ri-share-line text-lg"></i>
                    <span className="font-medium">Share</span>
                  </button>

                  {/* Share Dropdown */}
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 glass-card border border-white/20 rounded-xl overflow-hidden shadow-2xl z-10 min-w-[200px]">
                      <button
                        onClick={() => handleShare("facebook")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-white"
                      >
                        <i className="ri-facebook-fill text-blue-500 text-xl"></i>
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare("twitter")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-white"
                      >
                        <i className="ri-twitter-x-line text-white text-xl"></i>
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare("linkedin")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-white"
                      >
                        <i className="ri-linkedin-fill text-blue-400 text-xl"></i>
                        <span>LinkedIn</span>
                      </button>
                      <button
                        onClick={() => handleShare("copy")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-white border-t border-white/10"
                      >
                        <i className="ri-file-copy-line text-green-400 text-xl"></i>
                        <span>Copy Link</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <i className="ri-chat-3-line text-white text-xl"></i>
              </div>
              <h2 className="h3 text-white">Comments ({post.comments.length})</h2>
            </div>

            {user ? (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="flex gap-3">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || user.username}
                      className="w-10 h-10 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full glass-input border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 resize-none"
                      rows="3"
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <i className="ri-send-plane-line"></i>
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 glass-light p-6 rounded-xl border border-white/20 text-center">
                <p className="text-white/70 body">Please login to comment on this post</p>
              </div>
            )}

            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <div className="glass-light p-8 rounded-xl border border-white/20 text-center">
                  <i className="ri-chat-off-line text-4xl text-white/40 mb-3"></i>
                  <p className="text-white/70 body">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="glass-light rounded-xl p-5 border border-white/20 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {comment.authorImage ? (
                        <img
                          src={comment.authorImage}
                          alt={comment.authorName}
                          className="w-10 h-10 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">{comment.authorName}</p>
                          <span className="text-white/40">•</span>
                          <p className="text-white/60 text-sm">{formatDate(comment.createdAt)}</p>
                        </div>
                        <p className="text-white body leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-6 space-y-3 mt-4 pl-4 border-l-2 border-white/10">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="glass-light rounded-lg p-3 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold text-white text-sm">{reply.authorName}</p>
                                  <span className="text-white/40 text-xs">•</span>
                                  <p className="text-white/60 text-xs">{formatDate(reply.createdAt)}</p>
                                </div>
                                <p className="text-white/90 body-small whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {user && (
                          <div className="mt-4 flex gap-2">
                            <input
                              type="text"
                              value={replyContent[comment._id] || ""}
                              onChange={(e) =>
                                setReplyContent({ ...replyContent, [comment._id]: e.target.value })
                              }
                              placeholder="Write a reply..."
                              className="flex-1 glass-input border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 body-small"
                            />
                            <button
                              onClick={() => handleAddReply(comment._id)}
                              disabled={!replyContent[comment._id]?.trim()}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <i className="ri-reply-line"></i>
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {showEditModal && post && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur z-50 overflow-y-auto p-4">
          <div className="glass-card rounded-2xl p-6 md:p-8 w-full max-w-4xl relative text-white my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <i className="ri-edit-line text-white text-2xl"></i>
              </div>
              <div>
                <h2 className="h2 text-white">Edit Post</h2>
                <p className="body-small text-white/70">Update your post content</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-text"></i>
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full glass-input border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  placeholder="Enter an engaging title for your post..."
                  required
                />
              </div>

              <div className="relative category-dropdown-container">
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-price-tag-3-line"></i>
                  Category *
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full glass-input border border-white/20 rounded-xl p-4 text-left flex items-center justify-between hover:border-white/40 transition-all focus:ring-2 focus:ring-blue-400"
                >
                  <div className="flex items-center gap-3">
                    {categories.find(cat => cat.value === editForm.category) && (
                      <>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categories.find(cat => cat.value === editForm.category).color} flex items-center justify-center shadow-lg`}>
                          <i className={`${categories.find(cat => cat.value === editForm.category).icon} text-white text-lg`}></i>
                        </div>
                        <span className="text-white font-medium">{editForm.category}</span>
                      </>
                    )}
                  </div>
                  <i className={`ri-arrow-down-s-line text-white text-xl transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/20 rounded-xl overflow-hidden z-10 shadow-2xl">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setEditForm({ ...editForm, category: cat.value });
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-white/10 transition-all ${
                          editForm.category === cat.value ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                          <i className={`${cat.icon} text-white text-lg`}></i>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{cat.value}</p>
                        </div>
                        {editForm.category === cat.value && (
                          <i className="ri-check-line text-green-400 text-xl"></i>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-file-text-line"></i>
                  Content *
                </label>
                <div className="glass-card border border-white/20 rounded-xl overflow-hidden">
                  <div ref={editorRef} className="bg-white/5 min-h-[200px]"></div>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-hashtag"></i>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full glass-input border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  placeholder="e.g., javascript, react, tutorial"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-image-line"></i>
                  Media (Images/Videos) - Upload new to replace existing
                </label>
                <div className="glass-card border border-white/20 rounded-xl p-6 border-dashed hover:border-white/40 transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setEditForm({ ...editForm, mediaFiles: Array.from(e.target.files) })}
                    className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 file:transition-all file:shadow-lg cursor-pointer"
                  />
                  {editForm.mediaFiles.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-white/70 text-sm glass-light px-4 py-2 rounded-lg w-fit">
                      <i className="ri-checkbox-circle-line text-green-400"></i>
                      {editForm.mediaFiles.length} file(s) selected (will replace existing)
                    </div>
                  )}
                  {post.media && post.media.length > 0 && editForm.mediaFiles.length === 0 && (
                    <div className="mt-4 text-white/60 text-sm">
                      Current media: {post.media.length} file(s). Upload new files to replace.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <i className="ri-save-line"></i>
                  Update Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm({
                      title: "",
                      content: "",
                      category: "General",
                      tags: "",
                      mediaFiles: [],
                    });
                    if (quillRef.current) {
                      quillRef.current = null;
                    }
                  }}
                  className="px-8 py-4 glass-light text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Cancel
                </button>
              </div>
            </form>

            <button
              onClick={() => {
                setShowEditModal(false);
                setEditForm({
                  title: "",
                  content: "",
                  category: "General",
                  tags: "",
                  mediaFiles: [],
                });
                if (quillRef.current) {
                  quillRef.current = null;
                }
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PostDetail;

