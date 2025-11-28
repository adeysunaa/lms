import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/student/Navbar";
import Footer from "../../components/student/Footer";

const Forum = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const { user } = useUser();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    "All",
    "General",
    "Questions",
    "Announcements",
    "Help",
    "Feedback",
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${backendUrl}/api/forum/posts${
          selectedCategory !== "All" ? `?category=${selectedCategory}` : ""
        }`
      );

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        (post.tags &&
          post.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
    setFilteredPosts(filtered);
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation(); // Prevent card click event

    if (
      !window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
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
        // Remove post from local state
        setPosts(posts.filter((post) => post._id !== postId));
        setFilteredPosts(filteredPosts.filter((post) => post._id !== postId));
      } else {
        toast.error(data.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  return (
    <>
      <div className="min-h-screen pt-20 pb-10 px-4 md:px-8 lg:px-36">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="h1 text-white mb-3">Community Forum</h1>
            <p className="body-large text-white/80">
              Connect with learners and share knowledge
            </p>
          </div>

          {/* Search Bar */}
          <div className="glass-card rounded-2xl p-4 mb-6 border border-white/20">
            <div className="flex items-center gap-3">
              <i className="ri-search-line text-white text-xl"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, authors, or tags..."
                className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none body"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              )}
            </div>
          </div>

          {/* Categories and Create Button */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="glass-card rounded-2xl px-4 py-3 border border-white/20 flex-1">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <i className="ri-filter-3-line text-white/70 text-lg flex-shrink-0"></i>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "bg-white/5 text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate("/forum/create")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="ri-add-line text-lg"></i>
              <span>Create Post</span>
            </button>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="mb-4 text-white/70 body-small">
              Found {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "post" : "posts"} matching "
              {searchQuery}"
            </div>
          )}

          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/20">
              <i className="ri-loader-4-line text-5xl animate-spin text-white/60"></i>
              <p className="mt-4 text-white/70 body">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/20">
              <i className="ri-inbox-line text-6xl mb-4 text-white/40"></i>
              <p className="text-white/70 body-large mb-2">
                {searchQuery ? "No posts match your search" : "No posts found"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors body-small"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const firstImage =
                  post.media && post.media.length > 0
                    ? post.media.find((m) => m.type === "image")
                    : null;
                const imageUrl =
                  firstImage?.url || firstImage?.thumbnail || null;

                return (
                  <div
                    key={post._id}
                    className="glass-card rounded-2xl overflow-hidden border border-white/20 hover:border-white/30 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] flex flex-col"
                    onClick={() => navigate(`/forum/post/${post._id}`)}
                  >
                    {imageUrl && (
                      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <img
                          src={imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-transparent border border-white/30 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                            {post.category}
                          </span>
                        </div>
                        {(post.isPinned || post.isLocked) && (
                          <div className="absolute top-3 right-3 flex gap-2">
                            {post.isPinned && (
                              <i className="ri-pushpin-fill text-yellow-400 text-lg drop-shadow-lg"></i>
                            )}
                            {post.isLocked && (
                              <i className="ri-lock-line text-red-400 text-lg drop-shadow-lg"></i>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        {post.author.image ? (
                          <img
                            src={post.author.image}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {post.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm truncate">
                              {post.author.name}
                            </span>
                            {!imageUrl && post.isPinned && (
                              <i className="ri-pushpin-fill text-yellow-400 text-xs"></i>
                            )}
                            {!imageUrl && post.isLocked && (
                              <i className="ri-lock-line text-red-400 text-xs"></i>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <span>{formatDate(post.createdAt)}</span>
                            {!imageUrl && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-transparent border border-white/20 rounded-full">
                                  {post.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">
                        {post.title}
                      </h3>

                      <p className="text-white/70 text-sm line-clamp-3 mb-4 flex-1">
                        {post.content.replace(/<[^>]*>/g, "").substring(0, 120)}
                        {post.content.replace(/<[^>]*>/g, "").length > 120 &&
                          "..."}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg text-xs text-white/70 border border-white/10"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg text-xs text-white/70 border border-white/10">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <i className="ri-eye-line"></i>
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="ri-heart-line"></i>
                            <span>{post.likes.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="ri-chat-3-line"></i>
                            <span>{post.comments.length}</span>
                          </div>
                        </div>
                        {user && user.id === post.author.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/forum/post/${post._id}`);
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded-lg"
                              title="View and edit post"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={(e) => handleDeletePost(e, post._id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                              title="Delete post"
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Forum;
