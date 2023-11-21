import React from 'react';
import { FiSettings } from 'react-icons/fi';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { IoIosAdd } from 'react-icons/io';

interface NavbarProps {
  openAddVideoMenu: () => void;
  openConfigMenu: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme, isDarkMode, openAddVideoMenu, openConfigMenu }) => {
  return (
    <nav
      className={
        "fixed bg-inherit top-0 left-0 px-10 py-2 w-full h-14 dark:text-neutral-300 z-20 bg-white dark:bg-neutral-900"
      }
    >
      <div className="flex items-center justify-between h-full bg-none">
        <div className="flex items-center">
          <div className="text-lg font-bold w-[230px]">VidViewer</div>
        </div>
        <div className="flex items-center">
          <div className="flex gap-2">
            <button
              data-testid="light-dark-toggle"
              className="rounded-full w-9 h-9 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800"
              onClick={toggleTheme}
            >
              {isDarkMode ? (
                <HiOutlineSun className="text-xl" />
              ) : (
                <HiOutlineMoon className="text-xl" />
              )}
            </button>
            <button
              data-testid="config-form-toggle"
              className={
                "rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800  w-9 h-9 flex items-center justify-center "
              }
              onClick={openConfigMenu}
            >
              <FiSettings className="" />
            </button>

            <button
              data-testid="new-video-toggle"
              className={
                "rounded-full bg-neutral-200 hover:bg-opacity-60 dark:bg-neutral-800  dark:hover:bg-neutral-700 w-9 h-9 flex items-center justify-center"
              }
              onClick={openAddVideoMenu}
            >
              <IoIosAdd className="text-2xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;