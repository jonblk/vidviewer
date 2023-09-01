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
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';
import { useEvent } from './hooks/useEvent';
import ConfigForm from './components/ConfigForm';

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
  config,
  ffmpegNotFound,
  ytdlpNotFound
}

// Received websocket message types:
const VIDEO_DOWNLOAD_SUCCESS = "video_download_success"
const VIDEO_DOWNLOAD_FAIL    = "video_download_fail"
const ROOT_FOLDER_NOT_FOUND  = "root_folder_not_found"
const FFMPEG_NOT_FOUND       = "ffmpeg_not_found"
const YTDLP_NOT_FOUND        = "ytdlp_not_found"

type WebSocketMessage = {
  type: string 
  payload: string | boolean | Video[] | Playlist[]
}

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalState, setModalState] = useState<ModalState>(ModalState.none);

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>();

  const [isConfigMissing, setIsConfigMissing] = useState<boolean>();


  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Current video that is open
  const [selectedVideo, setSelectedVideo] = useState<Video>();

  // Current playlist that is selected to be edited
  const [selectedPlaylistEdit, setSelectedPlaylistEdit] = useState<Playlist>();

  // Current video that is selected to be edited
  const [selectedVideoEdit, setSelectedVideoEdit] = useState<Video>();

  // Set the dark/light visual mode
  const [darkMode, toggleDarkMode] = useDarkMode();

  // Establish websocket connection
  const { lastMessage, readyState } = useWebSocket(
    "wss://localhost:8000/websocket"
  );

  const fetchPlaylists = async (callback?: () => void) => {
    try {
      const response = await fetch("https://localhost:8000/playlists");
      const data = (await response.json()) as Playlist[];

      setPlaylists(data);

      if (callback) callback();
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const onClickAddVideo = () => {
    setModalState(ModalState.addVideo);
  };

  const onClickEditPlaylist = (playlist: Playlist) => {
    setModalState(ModalState.editPlaylist);
    setSelectedPlaylistEdit(playlist);
  };

  const onClickEditVideo = (video: Video) => {
    setModalState(ModalState.editVideo);
    setSelectedVideoEdit(video);
  };

  const onClickNewPlaylist = () => {
    setModalState(ModalState.addPlaylist);
  };

  const closeModal = () => {
    setModalState(ModalState.none);
  };

  // FETCH the playlists on initial render only after websocket connection is connected
  useEffect(() => {
    if (readyState === WebSocket.CLOSED || readyState === WebSocket.CONNECTING)
      return;
    fetchPlaylists().catch((e) => console.log(e));
  }, [readyState]);

  const onVideoDownloadSuccess = useEvent(() => {
    // Update the UI
    if (selectedPlaylist) {
      setLastUpdate(Date.now())
      //fetchPlaylistVideos(selectedPlaylist.id).catch((e) => console.log(e));
    }
  });

  // Setup websocket connection
  useEffect(() => {
    // Handle lastMessage
    if (readyState === WebSocket.OPEN && lastMessage) {
      if (lastMessage.data && typeof lastMessage.data === "string") {
        const message: WebSocketMessage = JSON.parse(
          lastMessage.data
        ) as WebSocketMessage;

        if (message.type === VIDEO_DOWNLOAD_FAIL) {
          console.error("Video download failed");
        } else if (message.type === VIDEO_DOWNLOAD_SUCCESS) {
          console.log("Video download complete");
          onVideoDownloadSuccess();
        } else if (message.type === ROOT_FOLDER_NOT_FOUND) {
          setIsConfigMissing(true);
          setModalState(ModalState.config);
        } else if (message.type === FFMPEG_NOT_FOUND) {
          setModalState(ModalState.ffmpegNotFound)
        } else if (message.type === YTDLP_NOT_FOUND) {
          setModalState(ModalState.ytdlpNotFound)
        }
      }
    }
  }, [readyState, lastMessage, onVideoDownloadSuccess]);

  return (
    <>
      <Modal
        isLocked={
          isConfigMissing ||
          modalState === ModalState.ytdlpNotFound ||
          modalState === ModalState.ffmpegNotFound
        }
        onClose={closeModal}
        isOpen={modalState !== ModalState.none}
      >
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
        {modalState === ModalState.editVideo && selectedVideoEdit && (
          <EditVideoForm
            allPlaylists={playlists.slice(1)} /* remove 'ALL' from playlists */
            id={selectedVideoEdit.id}
            initialTitle={selectedVideoEdit.title}
            onSuccess={() => {
              setLastUpdate(Date.now());
              setModalState(ModalState.none);
              return Promise.resolve();
            }}
          />
        )}
        {modalState == ModalState.config && (
          <ConfigForm
            onSuccess={async () => {
              setIsConfigMissing(false);
              setModalState(ModalState.none);
              return fetchPlaylists(() =>
                setSelectedPlaylist(playlists[0])
              ).catch((e) => console.log(e));
            }}
          />
        )}
        {modalState === ModalState.ytdlpNotFound && (
          <div>
            <h1 className="text-xl text-red-500 font-bold">ydtlp not found!</h1>
            <p> ytdlp must be available in your system's path </p>
          </div>
        )}
        {modalState === ModalState.ffmpegNotFound && (
          <div>
            <h1 className="text-xl font-bold">ffmpeg not found!</h1>
            <p> ffmpeg must be available in your system's path </p>
          </div>
        )}
      </Modal>
      <div className="min-h-screen h-fit dark:bg-neutral-950 dark:text-neutral-100">
        <div className={selectedVideo ? "dark" : ""}>
        <Navbar
          isVideoMode={!!selectedVideo}
          toggleTheme={toggleDarkMode}
          isDarkMode={darkMode}
          openAddVideoMenu={onClickAddVideo}
          openConfigMenu={() => setModalState(ModalState.config)}
        /></div>
        {!selectedVideo && (
          <LeftMenu
            onClickOpenEditPlaylistMenu={onClickEditPlaylist}
            onClickOpenNewPlaylistMenu={onClickNewPlaylist}
            playlists={playlists}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={(p: Playlist) => {
              setSelectedPlaylist(p);
              setLastUpdate(Date.now());
            }}
          />
        )}
        <main className={"pt-14" + (selectedVideo ? "" : " pl-60")}>
          {!selectedVideo ? (
            selectedPlaylist && (
              <VideoGrid
                key={lastUpdate} // unmount when updated so the videos/page are reset
                playlistId={selectedPlaylist.id}
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