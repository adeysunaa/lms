import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full pt-24 md:pt-28 px-6 md:px-0 space-y-8 text-center pb-24 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 space-y-6 w-full">
        <div className="inline-block mb-2 pt-4">
          <span className="glass-light px-4 py-1.5 rounded-full body-small text-white/90 backdrop-blur-md">
            🎓 Transform Your Career Today
          </span>
        </div>

        <h1 className="h1 relative text-white text-balance max-w-5xl mx-auto drop-shadow-[0_15px_45px_rgba(15,3,40,0.55)] animate-fade-in text-center tracking-tight">
          <span className="inline-block text-[1.12em] md:text-[1.18em] leading-tight">
            Discover courses that
          </span>{" "}
          <span className="block md:inline-block mt-2 md:mt-0 bg-gradient-to-r from-cyan-200 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient [background-size:220%_auto] text-[0.95em] md:text-[1em] font-bold drop-shadow-[0_8px_30px_rgba(130,80,255,0.45)] tracking-tight">
            move your career forward
          </span>
          <img
            src={assets.sketch}
            alt="sketch"
            className="md:block hidden absolute -bottom-8 right-0 opacity-20 animate-float"
          />
        </h1>

        <p className="body-large md:block hidden text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg text-center">
          World-class instructors, interactive projects, and a supportive
          community—everything you need to reach the next milestone faster.
        </p>
        <p className="body md:hidden text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow-lg text-center">
          Learn with expert mentors, do real projects, and grow with a vibrant
          community.
        </p>

        <div className="pt-4">
          <SearchBar />
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 md:pt-12 text-white max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-1">
            <span className="h2 font-extrabold">10,000+</span>
            <span className="label text-white/80">
              Students
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="h2 font-extrabold">500+</span>
            <span className="label text-white/80">
              Courses
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="h2 font-extrabold">50+</span>
            <span className="label text-white/80">
              Instructors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
