import React, { useState } from 'react';
import { IoMdSunny, IoMdMoon } from 'react-icons/io';
 
interface NavbarProps {
    toggleTheme: () => void;
    isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme, isDarkMode }) => {
    return (
    <nav className="flex items-center justify-between bg-none">
        <div className="text-lg font-bold">VidViewer</div>
        <div className="flex items-center">
        <button className="mr-2" onClick={toggleTheme}>
            {isDarkMode ? <IoMdSunny /> : <IoMdMoon />}
        </button>
        </div>
    </nav>
    );
};

export default Navbar;