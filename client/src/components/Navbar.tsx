import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

interface NavbarProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme, isDarkMode }) => {
  return (
    <nav className="fixed bg-white dark:bg-neutral-900 top-0 left-0 px-10 py-2 w-full h-14">
    <div className="flex items-center justify-between h-full bg-none">
      <div className="text-lg font-bold">VidViewer</div>
      <div className="flex items-center">
        <button className="" onClick={toggleTheme}>
          {isDarkMode ? <FiSun /> : <FiMoon />}
        </button>
      </div>
    </div></nav>
  );
};

export default Navbar;