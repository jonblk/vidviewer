import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LeftMenu from './components/LeftMenu';
import VideoGrid from './components/VideoGrid';
import Video from './components/Video';
import Modal from './components/Modal';
import AddVideoForm from './components/AddVideoForm';
import EditPlaylistForm from './components/EditPlaylistForm';
import NewPlaylistForm from './components/NewPlaylistForm';
import EditVideoForm from './components/EditVideoForm';
import { formatSeconds } from './util';
import { useDarkMode } from './hooks/useDarkMode';
//import DownloadStatus from './components/DownloadStatus';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';
import { useEvent } from './hooks/useEvent';

export interface Playlist {
  id: number;
  name: string;
}

export interface Video {
  id: number;
  file_path: string;
  thumbnail_path: string;
  title: string;
  duration: string;
  url: string
}

enum ModalState {
  none,
  editVideo,
  addVideo,
  editPlaylist,
  addPlaylist,
  settings,
}



// Received websocket message types:
const VIDEO_DOWNLOAD_SUCCESS = "video_download_success"
const VIDEO_DOWNLOAD_FAIL    = "video_download_fail"

type WebSocketMessage = {
  type: string 
  payload: any
}

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [videos, setVideos] = useState<Video[]>([])
  const [modalState, setModalState] = useState<ModalState>(ModalState.none);

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>();

  // Current video that is open 
  const [selectedVideo, setSelectedVideo] = useState<Video>();

  // Current playlist that is selected to be edited
  const [selectedPlaylistEdit, setSelectedPlaylistEdit] = useState<Playlist>()

  // Current video that is selected to be edited
  const [selectedVideoEdit, setSelectedVideoEdit] = useState<Video>()

  // Set the dark/light visual mode
  const [darkMode, toggleDarkMode] = useDarkMode()

  // Establish websocket connection
  const { lastMessage, readyState } = useWebSocket('ws://localhost:8000/websocket');

  const fetchPlaylists = async (callback?: () => void) => {
    try {
      const response = await fetch("http://localhost:8000/playlists");
      const data = await response.json();
      setPlaylists(data);
      if (callback) {
        callback()
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchPlaylistVideos = async (id: number | undefined, onSuccess?: (videos: Video[]) => void) => {
    try {
      const response = await fetch(`http://localhost:8000/playlist_videos/${id}`);
      const data = await response.json();
      setVideos(data);

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error("Error fetching playlist videos:", error);
    } 
  };

  const onClickAddVideo = () => {
    setModalState(ModalState.addVideo)
  }

  const onClickEditPlaylist = (playlist: Playlist) => {
    setModalState(ModalState.editPlaylist)
    setSelectedPlaylistEdit(playlist)
  }

  const onClickEditVideo = (video: Video) => {
    setModalState(ModalState.editVideo)
    setSelectedVideoEdit(video)
  }

  const onClickNewPlaylist = () => {
    setModalState(ModalState.addPlaylist)
  }

  const closeModal = () => {
    setModalState(ModalState.none)
  }

  // FETCH the playlists
  // On initial render
  useEffect(() => {
    fetchPlaylists().catch(e => console.log(e))
  }, []);

  // FETCH the playlist's videos
  // When user selects a playlist
  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistVideos(selectedPlaylist.id).catch(e => console.log(e))
    }
  }, [selectedPlaylist])

  const onVideoDownloadSuccess = useEvent(() =>{
    // Update the UI
    if (selectedPlaylist) {
      fetchPlaylistVideos(selectedPlaylist.id).catch(e => console.log(e))
    }
  })

  console.log(lastMessage)

  useEffect(() => {
  // Handle lastMessage
  if (readyState === WebSocket.OPEN && lastMessage) {
    console.log("Websocket message receieved:")
    console.log(lastMessage)
    if (lastMessage.data && typeof lastMessage.data === "string") {
      const message: WebSocketMessage = JSON.parse(lastMessage.data) as WebSocketMessage;

      if (message.type === VIDEO_DOWNLOAD_FAIL) {
        console.error("Video download failed") 
      } 
      else if (message.type === VIDEO_DOWNLOAD_SUCCESS) {
        console.log("Video download complete") 
        onVideoDownloadSuccess()
      }
      else {
        console.log(message.type) 
      }
    }
  }
},[readyState, lastMessage, onVideoDownloadSuccess])

  return (
    <>
      <Modal onClose={closeModal} isOpen={modalState !== ModalState.none}>
        {modalState === ModalState.addVideo && (
          <AddVideoForm
            playlists={playlists}
            onSuccess={() => setModalState(ModalState.none)}
          />
        )}
        {modalState === ModalState.addPlaylist && (
          <NewPlaylistForm
            onSuccess={() =>
              fetchPlaylists(() => setModalState(ModalState.none))
            }
          />
        )}
        {modalState === ModalState.editPlaylist && (
          <EditPlaylistForm
            id={selectedPlaylistEdit?.id}
            initialName={selectedPlaylistEdit?.name}
            onSuccess={() =>
              fetchPlaylists(() => setModalState(ModalState.none))
            }
          />
        )}
        {modalState === ModalState.editVideo && (
          <EditVideoForm
            id={selectedVideoEdit?.id}
            initialTitle={selectedVideoEdit?.title}
            onSuccess={() =>
              fetchPlaylistVideos(selectedPlaylist?.id, (videos: Video[]) => {
                setModalState(ModalState.none);
                // update selected video
                setSelectedVideo(
                  videos.find((v) => v.id === selectedVideo?.id)
                );
              })
            }
          />
        )}
      </Modal>
      <div className="min-h-screen h-fit dark:bg-neutral-950 dark:text-neutral-100">
        <Navbar
          isVideoMode={!!selectedVideo}
          toggleTheme={toggleDarkMode}
          isDarkMode={darkMode}
          openAddVideoMenu={onClickAddVideo}
        />
        {!selectedVideo && (
          <LeftMenu
            onClickOpenEditPlaylistMenu={onClickEditPlaylist}
            onClickOpenNewPlaylistMenu={onClickNewPlaylist}
            playlists={playlists}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
          />
        )}
        <main className={"pt-14" + (selectedVideo ? "" : " pl-60")}>
          {!selectedVideo ? (
            videos.length > 0 && (
              <VideoGrid
                videos={videos}
                onClickEditVideo={onClickEditVideo}
                onClickOpenVideo={setSelectedVideo}
              />
            )
          ) : (
            <div className="flex flex-col w-full">
              <Video
                setSelectedVideo={setSelectedVideo}
                videoId={selectedVideo.id}
              />
              {/* Video Info */}
              <div className="w-full flex justify-center">
                <div className="w-[55%] pt-4 py-10">
                  <div className="flex justify-between items-start">
                    <h1 className="text-lg">{selectedVideo.title}</h1>
                    <div className="text-neutral-300 flex items-center gap-2">
                      <a
                        className="text-neutral-400 hover:cursor-pointer hover:underline"
                        href={selectedVideo.url}
                      >
                        Youtube
                      </a>
                      |
                      <button
                        className="text-neutral-400 hover:cursor-pointer hover:underline"
                        onClick={() => onClickEditVideo(selectedVideo)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-neutral-400">
                      {formatSeconds(selectedVideo.duration)}{" "}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default App;