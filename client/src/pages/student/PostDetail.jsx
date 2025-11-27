import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/student/Navbar";
import Footer from "../../components/student/Footer";

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

  useEffect(() => {
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likes.includes(user.id));
    }
  }, [post, user]);

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
      <Footer />
    </>
  );
};

export default PostDetail;

