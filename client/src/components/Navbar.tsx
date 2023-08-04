import React from 'react';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { IoIosAdd } from 'react-icons/io';

interface NavbarProps {
  // If video playback mode then make the navbar black
  isVideoMode: boolean;

  // Opens a menu that allows user to add a new video
  openAddVideoMenu: () => void;

  // Toggle the theme (dark <-> light) 
  toggleTheme: () => void;

  // Required for showing correct icon (sun / moon)
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isVideoMode, toggleTheme, isDarkMode, openAddVideoMenu }) => {
  const darkclasses = (isVideoMode ? "!bg-black text-neutral-300" : "bg-white z-20 dark:bg-neutral-950")
  return (
    <nav className={"fixed bg-inherit top-0 left-0 px-10 py-2 w-full h-14 dark:text-neutral-300" + " " + darkclasses  }>
      <div className="flex items-center justify-between h-full bg-none">
        <div className="text-lg font-bold">VidViewer</div>
        <div className="flex items-center">
          <div className="flex gap-2">
            <button className="rounded-full p-1" onClick={toggleTheme}>
              {isDarkMode ? <HiOutlineSun className="text-xl"/> : <HiOutlineMoon className="text-xl" />}
            </button>
            <button className={"rounded-full p-1 bg-neutral-200 hover:bg-opacity-60 dark:bg-neutral-800" + " " + (isVideoMode ? "bg-neutral-800" : "") } onClick={openAddVideoMenu}>
              <IoIosAdd className="text-2xl"/>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;