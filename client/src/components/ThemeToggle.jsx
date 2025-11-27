import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/40"
      aria-label="Toggle dark mode"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <i className="ri-moon-fill text-white text-sm"></i>
      ) : (
        <i className="ri-sun-fill text-yellow-400 text-sm"></i>
      )}
    </button>
  );
};

export default ThemeToggle;

