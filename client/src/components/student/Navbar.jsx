import React, { useContext } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import ThemeToggle from "../ThemeToggle";
import SessionIndicator from "../SessionIndicator";

const Navbar = () => {
  const { navigate, isEducator, backendUrl, setIsEducator, getToken } =
    useContext(AppContext);

  const location = useLocation();
  const isCourseListPage = location.pathname.includes("/course-list");

  const { openSignIn } = useClerk();
  const { user } = useUser();

  const becomeEducator = async () => {
    try {
      if (isEducator) {
        navigate("/educator");
        return;
      }

      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + "/api/educator/update-role",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setIsEducator(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 fixed top-0 left-0 right-0 z-50 glass-navbar h-16 transition-all">
      <Link to="/" className="flex items-center">
        <img
          src={assets.logo}
          alt="NEXT4LEARNING Logo"
          className="cursor-pointer w-32 lg:w-40 transition-all pt-3 pb-1"
        />
      </Link>
      <div className="hidden md:flex items-center gap-4 text-white">
        <div className="flex items-center gap-3">
          {user && (
            <>
              <button
                onClick={becomeEducator}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all hover:scale-105"
                title={isEducator ? "Educator Dashboard" : "Become Educator"}
              >
                <i
                  className={`text-lg text-white ${
                    isEducator ? "ri-dashboard-3-fill" : "ri-user-star-line"
                  }`}
                ></i>
                <span className="text-sm font-medium">
                  {isEducator ? "Dashboard" : "Become Educator"}
                </span>
              </button>
              <Link
                to="/my-enrollments"
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all hover:scale-105"
                title="My Enrollments"
              >
                <i className="ri-book-open-line text-lg text-white"></i>
                <span className="text-sm font-medium">My Courses</span>
              </Link>
              <Link
                to="/course-list"
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all hover:scale-105"
                title="Courses"
              >
                <i className="ri-booklet-line text-lg text-white"></i>
                <span className="text-sm font-medium">Courses</span>
              </Link>
              <Link
                to="/forum"
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-full transition-all hover:scale-105"
                title="Forum"
              >
                <i className="ri-chat-3-line text-lg text-white"></i>
                <span className="text-sm font-medium">Forum</span>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SessionIndicator />
          <ThemeToggle />
          {user ? (
            <div className="clerk-user-button-wrapper">
              <UserButton />
            </div>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <i className="ri-user-line text-xl text-white"></i>
            </button>
          )}
        </div>
      </div>
      {/* Mobile view */}
      <div className="md:hidden flex items-center gap-3 text-white">
        {user && (
          <button
            onClick={becomeEducator}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title={isEducator ? "Educator Dashboard" : "Become Educator"}
          >
            <i
              className={`text-xl text-white ${
                isEducator ? "ri-dashboard-3-fill" : "ri-user-star-line"
              }`}
            ></i>
          </button>
        )}
        <Link to="/my-enrollments" title="My Courses">
          <i className="ri-book-open-line text-xl"></i>
        </Link>
        <Link to="/course-list" title="Courses">
          <i className="ri-booklet-line text-xl"></i>
        </Link>
        <Link to="/forum" title="Forum">
          <i className="ri-chat-3-line text-xl"></i>
        </Link>
        <ThemeToggle />
        {user ? (
          <div className="clerk-user-button-wrapper">
            <UserButton />
          </div>
        ) : (
          <button
            onClick={() => openSignIn()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <i className="ri-user-line text-xl text-white"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
