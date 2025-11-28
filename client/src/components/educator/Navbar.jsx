import React, { useContext } from "react";
import { assets, dummyEducatorData } from "../../assets/assets";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import { AppContext } from "../../context/AppContext";

const Navbar = ({ onMenuClick }) => {
  const educatorData = dummyEducatorData;
  const { user } = useUser();
  const { isEducator } = useContext(AppContext);

  return (
    <div className="glass-navbar text-white flex items-center justify-between px-4 sm:px-8 lg:px-16 h-16 border-b border-white/10 backdrop-blur-2xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button - Only show for educators on mobile */}
        {isEducator && onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20 z-50"
            aria-label="Open menu"
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        )}
        
        <Link to={"/"} className="flex items-center gap-3">
          <img
            src={assets.logo}
            alt="logo"
            className="w-32 lg:w-40 pt-3 pb-1"
          />
          <span className="hidden md:block text-sm uppercase tracking-[0.4em] text-white/70">
            Educator
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden sm:flex flex-col text-right leading-tight">
          <p className="text-xs text-white/60">Welcome back</p>
          <p className="text-sm font-semibold">
            {user ? user.fullName : educatorData.name}
          </p>
        </div>
        <div className="flex items-center">
          {user ? (
            <UserButton />
          ) : (
            <img
              className="w-10 h-10 rounded-full border border-white/20"
              src={assets.profile_img}
              alt="profile"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
