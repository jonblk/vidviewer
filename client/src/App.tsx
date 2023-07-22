import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LeftSideMenu from './components/LeftSideMenu';

export interface Playlist {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<null | number>(null);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };


  return (
    // Dark mode (set class for tailwind)
    <div className={isDarkMode ? 'dark' : 'light'}>
      <div className="flex flex-col px-8 p-4 gap-6 h-screen dark:bg-neutral-900 dark:text-neutral-100">
        <Navbar 
          toggleTheme={toggleTheme} 
          isDarkMode={isDarkMode} 
        />
        <LeftSideMenu 
          playlists={playlists} 
          setPlaylists={setPlaylists} 
          selectedPlaylist={selectedPlaylist} 
          setSelectedPlaylist={setSelectedPlaylist} 
        /> 
      </div>
    </div>
  );
};

export default App;