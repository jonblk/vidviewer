import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LeftSideMenu from './components/LeftSideMenu';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      <div className="flex flex-col px-8 p-4 gap-6 h-screen dark:bg-neutral-900 dark:text-neutral-100">
        <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <LeftSideMenu />
      </div>
    </div>
  );
};

export default App;