import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/educator/Navbar";
import Sidebar from "../../components/educator/Sidebar";
import Footer from "../../components/educator/Footer";

const Educator = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="text-white min-h-screen bg-transparent">
      <Navbar onMenuClick={handleMenuClick} />
      <div className="flex w-full items-start">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 min-h-screen bg-transparent">{<Outlet />}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Educator;
