import React from 'react';
import {  FiEdit3 } from 'react-icons/fi';
import { IoIosAdd } from 'react-icons/io';
import { Playlist } from '../App';
import { resetVideoGridData } from './VideoGrid';

interface LeftMenuProps {
  playlists: Playlist[];
  setSelectedPlaylist: (v: Playlist ) => void; 
  selectedPlaylist: Playlist | undefined ; // the playlist id
  onClickOpenEditPlaylistMenu: (playlist: Playlist) => void;
  onClickOpenNewPlaylistMenu:  () => void;
}

const LeftMenu: React.FC<LeftMenuProps> = ({playlists, selectedPlaylist, onClickOpenNewPlaylistMenu, onClickOpenEditPlaylistMenu, setSelectedPlaylist}) => {
  return (
    <div className="pl-10 flex flex-col fixed w-60 h-full pt-14 gap-2 ">
      <div className="flex w-full justify-end">
        <button
          data-testid="new-playlist-button"
          className="rounded-full flex w-10 items-center justify-center hover:bg-neutral-200 hover:dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-white p-2"
          onClick={() => onClickOpenNewPlaylistMenu()}
        >
          <IoIosAdd className="text-2xl" />
        </button>
      </div>

      <div className="h-full pr-3 pb-10 scrollbar overflow-y-auto">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="flex justify-between group">
            <button
              data-testid={playlist.id}
              className={`hover:cursor-pointer w-full flex items-center gap-1 dark:hover:text-neutral-100 ${
                playlist.id === selectedPlaylist?.id
                  ? "text-neutral-950  dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-500"
              }`}
              onClick={() => {
                resetVideoGridData();
                setSelectedPlaylist(playlist);
              }}
            >
              {playlist.name.substring(0, 17)}
            </button>

            {
              // dont show edit button if it's 'All' playlist
              playlist.id !== 0 && (
                <div
                  data-testid={`edit-playlist-button-${playlist.id}`}
                  onClick={() => onClickOpenEditPlaylistMenu(playlist)}
                  className="flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:cursor-pointer rounded-full dark:text-neutral-400 dark:hover:text-white"
                >
                  <FiEdit3 className="invisible group-hover:visible" />
                </div>
              )
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftMenu;