import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import CourseCard from "./CourseCard";

const CoursesSection = () => {
  const { allCourses } = useContext(AppContext);

  return (
    <div className="py-16 md:px-40 px-8">
      <div className="text-center">
        <h2 className="h2 text-white mb-4">
          Learn from the best
        </h2>
        <p className="body text-white/80 max-w-2xl mx-auto">
          Discover our top-rated courses across various categories. From coding
          and design to business and wellness, your courses are crafted to
          deliver results.
        </p>
      </div>

      <div className="grid grid-cols-auto px-4 md:px-0 md:my-16 my-10 gap-4">
        {allCourses.slice(0, 4).map((course, index) => (
          <CourseCard key={index} course={course} />
        ))}
      </div>

      <div className="text-center">
        <Link
          to={"/course-list"}
          onClick={() => scrollTo(0, 0)}
          className="glass-button text-white border border-white/30 px-10 py-3 rounded-xl inline-block hover:scale-105 transition-all duration-300"
        >
          Show all courses
        </Link>
      </div>
    </div>
  );
};

export default CoursesSection;
