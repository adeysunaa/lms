import React, { useState, useEffect, useContext } from "react";
import { assets } from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";

const SearchBar = ({ data }) => {
  const navigate = useNavigate();
  const { allCourses } = useContext(AppContext);
  const [input, setinput] = useState(data ? data : "");

  // Popular search tags
  const defaultSearchTags = [
    "Web Development",
    "Data Science",
    "UI/UX Design",
    "Mobile Development",
    "Cloud Computing",
  ];

  const [randomTags, setRandomTags] = useState([]);

  const getCourseTags = () => {
    if (allCourses && allCourses.length > 0) {
      const keywords = allCourses
        .flatMap((course) =>
          course.courseTitle
            ?.split(/\s+/)
            .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
            .filter((word) => word.length > 3)
            .slice(0, 2)
        )
        .filter(Boolean);
      const uniqueKeywords = Array.from(new Set(keywords));
      if (uniqueKeywords.length > 0) return uniqueKeywords;
    }
    return defaultSearchTags;
  };

  // Get 3 random tags on mount and when data changes
  useEffect(() => {
    const tags = getCourseTags();
    const shuffled = [...tags].sort(() => Math.random() - 0.5);
    setRandomTags(shuffled.slice(0, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, allCourses]);

  const onSearchHandler = (e) => {
    e.preventDefault();
    navigate("/course-list/" + input);
  };

  const handleTagClick = (tag) => {
    setinput(tag);
    navigate("/course-list/" + tag);
  };

  return (
    <div className="max-w-xl w-full mx-auto">
      <form
        onSubmit={onSearchHandler}
        className="w-full md:h-16 h-14 flex items-center glass-card border border-white/30 rounded-full backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,3,40,0.45)] px-2 md:px-4"
      >
        <img
          src={assets.search_icon}
          alt="search-icon"
          className="md:w-auto w-10 px-3 opacity-80"
        />
        <input
          onChange={(e) => setinput(e.target.value)}
          value={input}
          type="text"
          placeholder="Search for courses"
          className="w-full h-full outline-none text-white placeholder:text-white/60 bg-transparent"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white md:px-10 px-8 md:py-3 py-2 mx-1 font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-[0_15px_35px_rgba(75,45,180,0.55)] hover:scale-[1.03] flex items-center gap-2"
        >
          Search
          <i className="ri-arrow-right-line text-lg"></i>
        </button>
      </form>

      {/* Random Search Tags */}
      {randomTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
          <span className="text-white/70 text-sm">Popular:</span>
          {randomTags.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag)}
              className="glass-light px-3 py-1.5 rounded-full text-sm text-white/90 hover:text-white hover:bg-white/25 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 backdrop-blur-md"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
