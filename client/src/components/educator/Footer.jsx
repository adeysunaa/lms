import React from "react";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <footer className="flex md:flex-row flex-col items-center justify-between text-left w-full px-8 border-t">
      {/* Left section: Logo and Copyright */}
      <div className="flex items-center gap-4">
        <img src={assets.logo} alt="logo" className="block" />
        <div className="h-7 w-px ml-24 bg-gray-500/60 hidden md:block"></div>
        <p className="py-4 text-center text-xs md:text-sm text-gray-500">
          Copyright © Mekong-Learning. All Rights Reserved.
        </p>
      </div>

      {/* Right section: Social Media Icons */}
      <div className="flex items-center gap-3">
        <a href="#">
          <img src={assets.facebook_icon} alt="facebook_icon" />
        </a>
        <a href="#">
          <img src={assets.twitter_icon} alt="twitter_icon" />
        </a>
        <a href="#">
          <img src={assets.instagram_icon} alt="instagram_icon" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
