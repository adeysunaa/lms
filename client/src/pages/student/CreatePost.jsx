import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/student/Navbar";
import Footer from "../../components/student/Footer";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const CreatePost = () => {
  const navigate = useNavigate();
  const { backendUrl, getToken } = useContext(AppContext);
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const quillRef = React.useRef(null);
  const editorRef = React.useRef(null);

  const categories = [
    { value: "General", icon: "ri-chat-1-line", color: "from-blue-400 to-cyan-400" },
    { value: "Questions", icon: "ri-question-line", color: "from-purple-400 to-pink-400" },
    { value: "Announcements", icon: "ri-megaphone-line", color: "from-orange-400 to-red-400" },
    { value: "Help", icon: "ri-hand-heart-line", color: "from-green-400 to-emerald-400" },
    { value: "Feedback", icon: "ri-feedback-line", color: "from-yellow-400 to-amber-400" },
  ];

  React.useEffect(() => {
    if (editorRef.current && !quillRef.current) {
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
        setContent(quillRef.current.root.innerHTML);
      });
    }
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("tags", JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean)));

      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const { data } = await axios.post(
        `${backendUrl}/api/forum/create-post`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success("Post created successfully!");
        navigate(`/forum/post/${data.post._id}`);
      } else {
        toast.error(data.message || "Failed to create post");
        console.error("Post creation error:", data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
      console.error("Post creation error:", error);
    }
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen pt-20 pb-10 flex items-center justify-center">
          <div className="text-center text-white/60">
            <i className="ri-user-line text-6xl mb-4"></i>
            <p>Please login to create a post</p>
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

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <i className="ri-edit-line text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="h2 text-white">Create New Post</h1>
                <p className="body-small text-white/70">Share your thoughts with the community</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-text"></i>
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                
                {/* Custom Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full glass-input border border-white/20 rounded-xl p-4 text-left flex items-center justify-between hover:border-white/40 transition-all focus:ring-2 focus:ring-blue-400"
                >
                  <div className="flex items-center gap-3">
                    {categories.find(cat => cat.value === category) && (
                      <>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categories.find(cat => cat.value === category).color} flex items-center justify-center shadow-lg`}>
                          <i className={`${categories.find(cat => cat.value === category).icon} text-white text-lg`}></i>
                        </div>
                        <span className="text-white font-medium">{category}</span>
                      </>
                    )}
                  </div>
                  <i className={`ri-arrow-down-s-line text-white text-xl transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/20 rounded-xl overflow-hidden z-10 shadow-2xl">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setCategory(cat.value);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-white/10 transition-all ${
                          category === cat.value ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                          <i className={`${cat.icon} text-white text-lg`}></i>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{cat.value}</p>
                          <p className="text-white/60 text-xs mt-0.5">
                            {cat.value === "General" && "General discussions and topics"}
                            {cat.value === "Questions" && "Ask questions and get answers"}
                            {cat.value === "Announcements" && "Important announcements"}
                            {cat.value === "Help" && "Get help from the community"}
                            {cat.value === "Feedback" && "Share your feedback"}
                          </p>
                        </div>
                        {category === cat.value && (
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
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full glass-input border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  placeholder="e.g., javascript, react, tutorial"
                />
                <p className="mt-2 text-white/60 text-xs flex items-center gap-1">
                  <i className="ri-information-line"></i>
                  Separate tags with commas to help others find your post
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-3 flex items-center gap-2">
                  <i className="ri-image-line"></i>
                  Media (Images/Videos)
                </label>
                <div className="glass-card border border-white/20 rounded-xl p-6 border-dashed hover:border-white/40 transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 file:transition-all file:shadow-lg cursor-pointer"
                  />
                  {mediaFiles.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-white/70 text-sm glass-light px-4 py-2 rounded-lg w-fit">
                      <i className="ri-checkbox-circle-line text-green-400"></i>
                      {mediaFiles.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <i className="ri-send-plane-line"></i>
                  Create Post
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/forum")}
                  className="px-8 py-4 glass-light text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
                >
                  <i className="ri-close-line"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CreatePost;

