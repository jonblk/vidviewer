import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LeftMenu from './components/LeftMenu';
import VideoGrid from './components/VideoGrid';
import Video from './components/Video';

export interface Playlist {
  id: number;
  name: string;
}

export interface Video {
  id: number;
  ytID: string;
  title: string;
}

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<null | number>(null);
  const [selectedVideo, setSelectedVideo] = useState<null | number>(null);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      <div className="px-10 min-h-screen h-fit dark:bg-neutral-900 dark:text-neutral-100">
        <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode}/>
        <LeftMenu 
          playlists={playlists} 
          setPlaylists={setPlaylists} 
          selectedPlaylist={selectedPlaylist} 
          setSelectedPlaylist={setSelectedPlaylist} 
        /> 
        <main className="pt-14 ml-60 pl-4">
          {
            selectedVideo === null ? 
            <VideoGrid onClickOpenVideo={setSelectedVideo} selectedPlaylistID={selectedPlaylist} />
            :
            <Video setSelectedVideo={setSelectedVideo} videoUrl=''/>
          }
        </main>
      </div>
    </div>
  );
};

export default App;