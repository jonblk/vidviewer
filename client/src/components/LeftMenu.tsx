import React, { useEffect, useState } from 'react';
import {  FiEdit3 } from 'react-icons/fi';
import { IoMdAdd} from 'react-icons/io';
import Popup from "reactjs-popup";
import { Playlist } from '../App';

const fetchPlaylists = async (onSuccess: React.Dispatch<React.SetStateAction<Playlist[]>>) => {
  try {
    const response = await fetch('http://localhost:8000/playlists');
    const data = await response.json();
    onSuccess(data);
  } catch (error) {
    console.error('Error fetching playlists:', error);
  }
};

interface FormComponentProps {
  onSuccess: () => void
  id?: number
  initialName?: string
}

const NewPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch("http://localhost:8000/playlists", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // or "multipart/form-data"
        },
        method: "POST",
        body: JSON.stringify({ name }),
      })
    } catch (e) {
      console.log(e);
    }

    onSuccess();
   ; // Call setPlaylists with the data variable
  };

  return (
    <form className="">
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          New Playlist
        </label>
        <input
          type="text"
          id="name"
          className="w-full border rounded py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Enter name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-4 ">
        
        
        <button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-700 text-white py-0.5 px-1 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSubmit}
        >
          Create
        </button>
      </div>
    </form>
  );
};

const EditPlaylistForm: React.FC<FormComponentProps> = ({ onSuccess, id, initialName }) => {
  const [name, setName] = useState(initialName);
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/playlists/${id}`, {
        headers: {
          "Content-Type": "application/json", // or "multipart/form-data"
        },
        method: "PUT",
        body: JSON.stringify({ name }),
      })
    } catch (e) {
      console.log(e);
    }

    onSuccess();
   ; // Call setPlaylists with the data variable
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch(`http://localhost:8000/playlists/${id}`, {
        method: "DELETE", 
      })
    } catch (e) {
      console.log(e);
    }

    onSuccess();
  };

  return (
    <form className="">
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Edit Playlist
        </label>
        <input
          type="text"
          id="name"
          className="border w-full rounded py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Edit name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col  gap-4 ">
        <button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-700 text-white py-0.5 px-1 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSubmit}
        >
          Update
        </button>

        {!pendingDelete && <button
          type="submit"
          className="flex-1 bg-neutral-200 hover:bg-neutral-300 px-1 rounded focus:outline-none focus:shadow-outline"
          onClick={() => setPendingDelete(true)}
        >
          Delete
        </button>
        }

        { pendingDelete && 
        <>
          Delete this playlist? 
          <button
          type="submit"
          className="flex-1 bg-neutral-900 hover:bg-black text-white px-1 rounded focus:outline-none focus:shadow-outline"
          onClick={() => setPendingDelete(false)}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex-1 bg-red-500 hover:bg-red-700 text-white px-1 rounded focus:outline-none focus:shadow-outline"
          onClick={handleDelete}
        >
          Delete '{name}'
        </button>
        </>
        }
      </div>
    </form>
  );
};

interface LeftMenuProps {
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>; 
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<number | null>>; 
  selectedPlaylist: number | null// the playlist id
}

const LeftMenu: React.FC<LeftMenuProps> = ({playlists, setPlaylists, selectedPlaylist, setSelectedPlaylist}) => {
  useEffect(() => {
    fetchPlaylists(setPlaylists);
  }, []);

   const handleEditPlaylist = (playlistId: number) => {
    // Implement edit playlist logic here
    console.log(`Editing playlist with ID: ${playlistId}`);
  };

  return (
    <div className="w-60 h-full fixed top-14 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-neutral-400">Playlists</h2>
        <Popup overlayStyle={{background: "black", opacity: 0.3}}trigger={<button
          className="flex items-center hover:bg-neutral-200 hover:dark:bg-neutral-800 dark:text-white rounded-full p-2 "
        >
          <IoMdAdd />
        </button>} position="right center">
          <div className="rounded bg-white p-4 w-[200px]">
            <NewPlaylistForm onSuccess={() => {fetchPlaylists(setPlaylists)}}/>
          </div>
        </Popup>
      </div>


      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="flex justify-between group"
        >
          <button 
            className={`hover:cursor-pointer flex items-center justify-center gap-1  ${playlist.id === selectedPlaylist ? "dark:text-white underline" : "dark:text-neutral-200"}`} 
            onClick={()=>setSelectedPlaylist(playlist.id)}>
              {playlist.name.substring(0,24)}
          </button>
          <Popup 
            overlayStyle={{ background: "black", opacity: 0.3 }} 
            trigger={ <div className="flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:cursor-pointer rounded-full dark:text-neutral-400 dark:hover:text-white"> <FiEdit3
              className="invisible group-hover:visible"
              onClick={() => handleEditPlaylist(playlist.id)}
            />  </div> } 
            position="right center"
          >
            <div className="rounded bg-white p-4 w-[200px]">
              <EditPlaylistForm initialName={playlist.name} id={playlist.id} onSuccess={() => { fetchPlaylists(setPlaylists) }} />
            </div>
          </Popup>
        </div>
      ))}
    </div>
  );
};

export default LeftMenu;