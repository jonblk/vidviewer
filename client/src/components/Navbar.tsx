import React from 'react';
import {   FiMoreHorizontal  } from 'react-icons/fi';
import {   HiRefresh } from 'react-icons/hi';
import { IoIosAdd, } from 'react-icons/io';

interface NavbarProps {
  currentDownloadCount: number;
  isDownloadStatusMenuOpen: boolean;
  toggleDownloadStatus: () => void;
  openAddVideoMenu: () => void;
  openConfigMenu: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({currentDownloadCount, isDownloadStatusMenuOpen, toggleDownloadStatus, openAddVideoMenu, openConfigMenu }) => {
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
        <div className="flex items-center gap-1">
          <button
            data-testid="new-video-toggle"
            className={
              "rounded-full dark:hover:text-white hover:bg-neutral-200  dark:hover:bg-neutral-800 dark:active:bg-neutral-700   w-10 h-10 flex items-center justify-center"
            }
            onClick={openAddVideoMenu}
          >
            <IoIosAdd className="text-2xl" />
          </button>
          <button
            data-testid="light-dark-toggle"
            className={`dark:hover:text-white rounded-full w-10 h-10 relative flex items-center justify-center ${
              isDownloadStatusMenuOpen ? "dark:bg-neutral-800" : ""
            } hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 `}
            onClick={toggleDownloadStatus}
          >
            <div
              className={`flex font-bold flex-col justify-center items-center rounded-full ${
                !currentDownloadCount
                  ? "dark:bg-neutral-700 font-bold dark:text-neutral-300 bg-neutral-300 text-neutral-900"
                  : "dark:bg-neutral-900  dark:text-green-400  bg-black text-white"
              } h-4 w-4 text-xs absolute  top-0 left-[26px]`}
            >
              {currentDownloadCount}
            </div>
            <HiRefresh className="text-l" />
          </button>
          <div className="flex gap-2">
            <button
              data-testid="config-form-toggle"
              className={
                "dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700  w-10 h-10 flex items-center justify-center "
              }
              onClick={openConfigMenu}
            >
              <FiMoreHorizontal className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;