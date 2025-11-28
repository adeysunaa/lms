import React, { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { NavLink } from "react-router-dom";

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { isEducator } = useContext(AppContext);
  
  const menuItem = [
    { name: "Dashboard", path: "/educator", icon: "ri-dashboard-line" },
    { name: "Add Course", path: "/educator/add-course", icon: "ri-add-circle-line" },
    { name: "My Courses", path: "/educator/my-course", icon: "ri-booklet-line" },
    { name: "Student Enrolled", path: "/educator/student-enrolled", icon: "ri-user-3-line" },
    { name: "Certificates", path: "/educator/certificates", icon: "ri-award-line" },
    { name: "Audit Trails", path: "/educator/audit-trails", icon: "ri-file-history-line" },
  ];

  return (
    isEducator && (
      <>
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Mobile Menu */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[70] glass-card rounded-t-3xl border-t border-white/20 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="px-6 py-8 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="px-3 mb-4">
              <p className="text-xs uppercase tracking-[0.5em] text-white/60">
                Manage
              </p>
            </div>
            {menuItem.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/educator"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? "bg-white/15 border-white/40 text-white shadow-lg"
                      : "border-transparent text-white/70 hover:bg-white/5 hover:border-white/20"
                  }`
                }
              >
                <span className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/15">
                  <i className={`${item.icon} text-lg`}></i>
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-white/50">
                    {item.name === "Student Enrolled"
                      ? "Track progress"
                      : item.name === "My Courses"
                      ? "Manage content"
                      : item.name === "Add Course"
                      ? "Create new lesson"
                      : item.name === "Certificates"
                      ? "Manage templates"
                      : "Overview"}
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-shrink-0 flex-col gap-4 px-5 py-8 border-r border-white/10 bg-white/5 backdrop-blur-2xl sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-3">
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">
              Manage
            </p>
          </div>
          {menuItem.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/educator"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${
                  isActive
                    ? "bg-white/15 border-white/40 text-white shadow-[0_15px_35px_rgba(15,3,40,0.35)]"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:border-white/20"
                }`
              }
            >
              <span className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center border border-white/15">
                <i className={`${item.icon} text-lg`}></i>
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-white/50">
                  {item.name === "Student Enrolled"
                    ? "Track progress"
                    : item.name === "My Courses"
                    ? "Manage content"
                    : item.name === "Add Course"
                    ? "Create new lesson"
                    : item.name === "Certificates"
                    ? "Manage templates"
                    : item.name === "Audit Trails"
                    ? "Activity history"
                    : "Overview"}
                </span>
              </div>
            </NavLink>
          ))}
        </div>
      </>
    )
  );
};

export default Sidebar;
