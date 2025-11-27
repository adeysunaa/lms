import React, { useContext } from "react";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { Link } from "react-router-dom";

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);

  return (
    <Link
      to={"/course/" + course._id}
      onClick={() => scrollTo(0, 0)}
      className="glass-card overflow-hidden rounded-3xl cursor-pointer group hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative overflow-hidden w-full aspect-video">
        <img
          src={course.courseThumbnail}
          alt={course.courseTitle}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        {course.discount > 0 && (
          <span className="absolute top-3 right-3 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full">
            -{course.discount}%
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      <div className="p-5 text-left flex-1 flex flex-col">
        <h3 className="h5 text-white mb-1 line-clamp-2">{course.courseTitle}</h3>
        {course.educator?.name && (
          <p className="body-small text-white/70 mb-3">by {course.educator.name}</p>
        )}
        <div className="flex items-center space-x-2 mb-4">
          <p className="text-white font-medium flex items-center gap-1">
            <i className="ri-star-fill text-yellow-300 text-sm"></i>
            {calculateRating(course).toFixed(1)}
          </p>
          <span className="text-white/60 text-sm">
            ({course.courseRatings.length} reviews)
          </span>
        </div>
        <div className="border-t border-white/15 my-4"></div>
        <div className="mt-auto flex items-center gap-3">
          <p className="text-2xl font-semibold text-white">
            {currency}
            {(
              course.coursePrice -
              (course.discount * course.coursePrice) / 100
            ).toFixed(2)}
          </p>
          {course.discount > 0 && (
            <p className="text-sm text-white/50 line-through">
              {currency}
              {course.coursePrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
