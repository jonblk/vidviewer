import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LeftMenu from './components/LeftMenu';
import VideoGrid, { getGridState, saveGridState } from './components/VideoGrid';
import Video from './components/Video';
import Modal from './components/Modal';
import EditPlaylistForm from './components/EditPlaylistForm';
import NewPlaylistForm from './components/NewPlaylistForm';
import EditVideoForm from './components/EditVideoForm';
import { useDarkMode } from './hooks/useDarkMode';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';
import { useEvent } from './hooks/useEvent';
import ConfigForm from './components/ConfigForm';
import AddVideoModal from './components/AddVideoModal';
import GlobalContext from './contexts/GlobalContext';

let rootURL: string
const env_server_port: string | undefined = process.env.SERVER_PORT
const websocketPath = `wss://localhost:${process.env.SERVER_PORT}/websocket`

if (env_server_port === undefined) {
  alert("SERVER_PORT env variable not found. Please check .env in root folder and rebuild the application")
  throw(new Error("missing "))
} else {
  rootURL = `https://localhost:${process.env.SERVER_PORT as string}`
}

export interface Playlist {
  id: number;
  name: string;
}

export interface Video {
  id: number;
  file_path: string;
  file_id:  string;
  thumbnail_path: string;
  title: string;
  duration: string;
  url: string;
  // track whether user deletes video, or removes video from playlist
  // this is needed to update the cached videos (in local storage) when the user 
  // navigates back to the playlist videos after watching the video. 
  removed: boolean  
}

export enum VideoUpdateType {
  REMOVE_FROM_PLAYLIST,
  DELETE,
  ADD_TO_PLAYLIST,
  UPDATE_PROPERTY
}

export type VideoUpdateProps = {
  type: VideoUpdateType
  title: string 
  id: number
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

  const [isPlaying, setIsPlaying] = useState(false);

  // Current video that is open
  const [selectedVideo, setSelectedVideo] = useState<Video>();

  // Current playlist that is selected to be edited
  const [selectedPlaylistEdit, setSelectedPlaylistEdit] = useState<Playlist>();

  // Current video that is selected to be edited
  const [selectedVideoEdit, setSelectedVideoEdit] = useState<Video>();

  // Set the dark/light visual mode
  const [darkMode, toggleDarkMode] = useDarkMode();

  // Playlist Videos
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([])

  // Establish websocket connection
  const { lastMessage, readyState } = useWebSocket(websocketPath);

  const fetchPlaylists = async (callback?: () => void) => {
    try {
      const response = await fetch(`${rootURL}/playlists`);
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
      //setLastUpdate(Date.now())
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
    <GlobalContext.Provider value={{ rootURL }}>
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
          <AddVideoModal
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
            // When user updates the video details, update the local state on the client
            onSuccess={(videoUpdate: VideoUpdateProps) => {
              let vids;
              switch (videoUpdate.type) {
                case VideoUpdateType.ADD_TO_PLAYLIST:
                  vids = playlistVideos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: false };
                    } else {
                      return v;
                    }
                  });
                  setPlaylistVideos(vids);
                  break;
                case VideoUpdateType.REMOVE_FROM_PLAYLIST:
                  vids = playlistVideos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: true };
                    } else {
                      return v;
                    }
                  });
                  setPlaylistVideos(vids);
                  break;
                case VideoUpdateType.DELETE:
                  vids = playlistVideos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: true };
                    } else {
                      return v;
                    }
                  });
                  setPlaylistVideos(vids);
                  break;
                case VideoUpdateType.UPDATE_PROPERTY:
                  vids = playlistVideos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      if (selectedVideo) {
                        setSelectedVideo({ ...v, title: videoUpdate.title });
                      }
                      return { ...v, title: videoUpdate.title };
                    } else {
                      return v;
                    }
                  });
                  setPlaylistVideos(vids);
                  break;
              }

              // If necessary update the local storage
              const storage = getGridState();
              if (storage && storage.videos.length > 0) {
                storage.videos = vids;
                saveGridState(storage);
              }
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

      <div className="min-h-screen h-fit dark:bg-neutral-900 dark:text-neutral-100">
        <div className={selectedVideo ? "dark" : ""}>
          <Navbar
            toggleTheme={toggleDarkMode}
            isDarkMode={darkMode}
            openAddVideoMenu={onClickAddVideo}
            openConfigMenu={() => setModalState(ModalState.config)}
          />
        </div>
        {!isPlaying && (
          <LeftMenu
            onClickOpenEditPlaylistMenu={onClickEditPlaylist}
            onClickOpenNewPlaylistMenu={onClickNewPlaylist}
            playlists={playlists}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={(p: Playlist) => {
              setSelectedPlaylist(p);
              //setLastUpdate(Date.now());
            }}
          />
        )}
        <main className={"pt-14" + (selectedVideo ? "" : " pl-60")}>
          {!isPlaying && selectedPlaylist && (
            <VideoGrid
              videos={playlistVideos}
              setVideos={setPlaylistVideos}
              playlistId={selectedPlaylist.id}
              onClickEditVideo={onClickEditVideo}
              onClickOpenVideo={(v: Video) => {
                setIsPlaying(true);
                setSelectedVideo(v);
              }}
            />
          )}

          {isPlaying && selectedVideo && (
            <Video
              onClose={() => {
                setSelectedVideo(undefined);
                setIsPlaying(false);
              }}
              video={selectedVideo}
              onClickEditVideo={onClickEditVideo}
            />
          )}
        </main>
      </div>
    </GlobalContext.Provider>
  );
};

export default App;