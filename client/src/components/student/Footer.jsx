import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="glass-card md:px-36 text-left w-full mt-10 backdrop-blur-xl border-t border-white/20">
      <div className="flex flex-col md:flex-row items-start px-8 md:px-0 justify-center gap-6 md:gap-16 py-6 border-b border-white/20">
        <div className="flex flex-col md:items-start items-center w-full">
          <img
            src={assets.logo_dark}
            alt="logo"
            className="w-16 lg:w-20 brightness-0 invert"
          />
          <p className="body-small mt-4 text-center md:text-left text-white/80">
            Empowering learners worldwide with high-quality online courses and
            certifications.
          </p>
        </div>
        <div className="flex flex-col md:items-start items-center w-full">
          <h3 className="h6 text-white mb-3">Company</h3>
          <ul className="flex flex-col w-full justify-between caption text-white/80 md:space-y-1">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Contact us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Privacy policy
              </a>
            </li>
          </ul>
        </div>
        <div className="hidden md:flex flex-col items-start w-full">
          <h3 className="h6 text-white mb-3">Subscribe to our newsletter</h3>
          <p className="caption text-white/80 mb-3">
            The latest news, articles, and resources, sent to your inbox weekly.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="glass-input border border-white/20 text-white placeholder:text-white/50 outline-none w-56 h-8 rounded-lg px-2 text-xs focus:ring-2 focus:ring-blue-400"
            />
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-8 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg text-xs">
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <p className="caption py-3 text-center text-white/60 text-xs">
        Copyright © {currentYear} NEXT4LEARN. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;
