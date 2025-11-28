import React, { useEffect, useState } from "react";

const Rating = ({ initialRating, onRate }) => {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (value) => {
    setRating(value);
    if (onRate) onRate(value);
  };

  useEffect(() => {
    if (initialRating) {
      setRating(initialRating);
    }
  }, [initialRating]);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= (hoverRating || rating);
        return (
          <button
            key={index}
            type="button"
            className={`text-2xl sm:text-3xl cursor-pointer transition-all duration-200 transform hover:scale-110 ${
              isActive
                ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                : "text-white/30 hover:text-white/50"
            }`}
            onClick={() => handleRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <i className={`${isActive ? "ri-star-fill" : "ri-star-line"}`}></i>
          </button>
        );
      })}
    </div>
  );
};

export default Rating;
