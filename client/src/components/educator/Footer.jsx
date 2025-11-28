import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="glass-card border border-white/10 rounded-3xl mx-4 my-10 px-6 py-5 flex flex-col md:flex-row items-center justify-between text-white backdrop-blur-2xl">
      <div className="flex items-center gap-4">
        <img
          src={assets.logo}
          alt="logo"
          className="w-16 lg:w-20 brightness-0 invert"
        />
        <div className="hidden md:block h-8 w-px bg-white/20"></div>
        <p className="text-xs md:text-sm text-white/70">
          © {new Date().getFullYear()} NEXT4LEARN. All Rights Reserved.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <a
          href="#"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
        >
          <i className="ri-facebook-line text-white text-lg"></i>
        </a>
        <a
          href="#"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
        >
          <i className="ri-twitter-line text-white text-lg"></i>
        </a>
        <a
          href="#"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition"
        >
          <i className="ri-instagram-line text-white text-lg"></i>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
