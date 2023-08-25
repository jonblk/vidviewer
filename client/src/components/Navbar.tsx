import React from 'react';
import { FiSettings } from 'react-icons/fi';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { IoIosAdd } from 'react-icons/io';

interface NavbarProps {
  isVideoMode: boolean;
  openAddVideoMenu: () => void;
  openConfigMenu: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isVideoMode, toggleTheme, isDarkMode, openAddVideoMenu, openConfigMenu }) => {
  const darkclasses = (isVideoMode ? "!bg-black text-neutral-300" : "bg-white z-20 dark:bg-neutral-950")
  return (
    <nav
      className={
        "fixed bg-inherit top-0 left-0 px-10 py-2 w-full h-14 dark:text-neutral-300" +
        " " +
        darkclasses
      }
    >
      <div className="flex items-center justify-between h-full bg-none">
        <div className="text-lg font-bold">VidViewer</div>
        <div className="flex items-center">
          <div className="flex gap-2">
            <button
              className="rounded-full w-9 h-9 flex items-center justify-center dark:text-neutral-400"
              onClick={toggleTheme}
            >
              {isDarkMode ? (
                <HiOutlineSun className="text-xl" />
              ) : (
                <HiOutlineMoon className="text-xl" />
              )}
            </button>
            <button
              className={
                "rounded-full bg-neutral-200 hover:bg-opacity-60 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 w-9 h-9 flex items-center justify-center" +
                " " +
                (isVideoMode ? "bg-neutral-800" : "")
              }
              onClick={openAddVideoMenu}
            >
              <IoIosAdd className="text-2xl" />
            </button>
            <button
              className={
                "rounded-full bg-neutral-200 hover:bg-opacity-60 dark:bg-neutral-800 dark:text-neutral-400 w-9 h-9 flex items-center justify-center  dark:hover:bg-neutral-700" +
                " " +
                (isVideoMode ? "bg-neutral-800" : "")
              }
              onClick={openConfigMenu}
            >
              <FiSettings className="" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;