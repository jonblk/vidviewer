import React from 'react';
import {  FiEdit3 } from 'react-icons/fi';
import { IoIosAdd } from 'react-icons/io';
import { Playlist } from '../App';

interface LeftMenuProps {
  playlists: Playlist[];
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<Playlist | undefined>>; 
  selectedPlaylist: Playlist | undefined; // the playlist id
  onClickOpenEditPlaylistMenu: (playlist: Playlist) => void;
  onClickOpenNewPlaylistMenu:  () => void;
}

const LeftMenu: React.FC<LeftMenuProps> = ({playlists, selectedPlaylist, onClickOpenNewPlaylistMenu, onClickOpenEditPlaylistMenu, setSelectedPlaylist}) => {
  return (
    <div className="pl-10 w-56 h-full fixed top-14 overflow-y-auto">
      <div className="flex items-center  justify-end gap-1">
        <button
          className="rounded-full flex items-center hover:bg-neutral-200 hover:dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-white p-1 "
          onClick={() => onClickOpenNewPlaylistMenu()}
        >
          <IoIosAdd className="text-2xl" />
        </button> 
      </div>

      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="flex justify-between group"
        >
          <button 
            className={`hover:cursor-pointer w-full flex items-center gap-1 dark:hover:text-neutral-100 ${playlist.id === selectedPlaylist?.id ? "text-neutral-950  dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-500"}`} 
            onClick={()=>setSelectedPlaylist(playlist)}>
              {playlist.name.substring(0,17)}
          </button>
            <div onClick={() => onClickOpenEditPlaylistMenu(playlist)} className="flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:cursor-pointer rounded-full dark:text-neutral-400 dark:hover:text-white">
              <FiEdit3 className="invisible group-hover:visible" 
            />  
            </div>  
        </div>
      ))}
    </div>
  );
};

export default LeftMenu;