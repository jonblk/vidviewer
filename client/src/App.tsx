import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LeftMenu from './components/LeftMenu';
import VideoGrid from './components/VideoGrid';
import Video from './components/VideoPlayer';
import Modal from './components/Modal';
import EditPlaylistForm from './components/EditPlaylistForm';
import NewPlaylistForm from './components/NewPlaylistForm';
import EditVideoForm from './components/EditVideoForm';
import { useDarkMode } from './hooks/useDarkMode';
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';
import ConfigForm from './components/ConfigForm';
import AddVideoModal from './components/NewVideoForm';
import GlobalContext from './contexts/GlobalContext';
import VideoPlayer from './components/VideoPlayer';
import DownloadStatus, { iDownloadStatus } from './components/DownloadStatus';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import Button from './components/Button';
import Label from './components/Label';

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
  download_date: string;
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
const ROOT_FOLDER_NOT_FOUND  = "root_folder_not_found"
const FFMPEG_NOT_FOUND       = "ffmpeg_not_found"
const YTDLP_NOT_FOUND        = "ytdlp_not_found"
const DOWNLOAD_STATUS        = "download_status"

type WebSocketMessage = {
  type: string
  payload: string | boolean | Video[] | Playlist[] | iDownloadStatus[]
}

function isDownloadStatus(element: any): element is iDownloadStatus {
 return 'is_complete' in element && 
      'is_error' in element && 
      'is_paused' in element && 
      'title' in element && 
      'url' in element && 
      'progress' in element && 
      'speed' in element; 
}

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalState, setModalState] = useState<ModalState>(ModalState.none);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>();
  const [isConfigMissing, setIsConfigMissing] = useState<boolean>();

  // Current video that is open
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  // Current playlist that is selected to be edited
  const [selectedPlaylistEdit, setSelectedPlaylistEdit] = useState<Playlist>();

  // Current video that is selected to be edited
  const [selectedVideoEdit, setSelectedVideoEdit] = useState<Video>();

  // Set the dark/light visual mode
  const [darkMode, toggleDarkMode] = useDarkMode();

  // Establish websocket connection
  const { lastMessage, readyState } = useWebSocket(websocketPath);

  const [lastVideoUpdate, setLastVideoUpdate] = useState(Date.now())

  const [videos, setVideos] = useState<Video[]>([]);

  const [downloadStatuses, setDownloadStatuses] = useState<iDownloadStatus[]>([])
  const [isDownloadStatusMenuOpen, setIsDownloadStatusMenuOpen] = useState(false)

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${rootURL}/playlists`);
      const data = (await response.json()) as Playlist[];

      setPlaylists(data);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return data
    } catch (error) {
      console.error("Error fetching playlists:", error);
      throw error
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

  // Setup websocket connection
  useEffect(() => {
    // Handle lastMessage
    if (readyState === WebSocket.OPEN && lastMessage) {
      if (lastMessage.data && typeof lastMessage.data === "string") {
        const message: WebSocketMessage = JSON.parse(
          lastMessage.data
        ) as WebSocketMessage;

        switch(message.type) {
          case ROOT_FOLDER_NOT_FOUND:
            setIsConfigMissing(true);
            setModalState(ModalState.config);
            break;
          case FFMPEG_NOT_FOUND:
            setModalState(ModalState.ffmpegNotFound);
            break;
          case YTDLP_NOT_FOUND:
            setModalState(ModalState.ytdlpNotFound);
            break;
          case DOWNLOAD_STATUS:
            if (Array.isArray(message.payload)) {
              const allElementsAreDownloadStatus = (message.payload as any[]).every(isDownloadStatus);
              if (allElementsAreDownloadStatus) {
                const downloads = message.payload as iDownloadStatus[];
                setDownloadStatuses(downloads)
              } else {
                console.warn("Non-downloadStatus found in payload array")
              }
            } else {
              console.warn("Download status payload should be array, but isn't")
            }
        }
      }
    }
  }, [readyState, lastMessage]);

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
              fetchPlaylists().then((_) => {
                setModalState(ModalState.none);
              })
            }
          />
        )}
        {modalState === ModalState.editPlaylist && (
          <EditPlaylistForm
            id={selectedPlaylistEdit?.id}
            initialName={selectedPlaylistEdit?.name}
            onSuccess={() =>
              fetchPlaylists().then((_) => {
                setModalState(ModalState.none);
              })
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
                  vids = videos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: false };
                    } else {
                      return v;
                    }
                  });
                  break;
                case VideoUpdateType.REMOVE_FROM_PLAYLIST:
                  vids = videos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: true };
                    } else {
                      return v;
                    }
                  });
                  break;
                case VideoUpdateType.DELETE:
                  setModalState(ModalState.none);
                  vids = videos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      return { ...v, removed: true };
                    } else {
                      return v;
                    }
                  });
                  break;
                case VideoUpdateType.UPDATE_PROPERTY:
                  vids = videos.map((v) => {
                    if (v.id === videoUpdate.id) {
                      // Note, is this necessary?
                      if (playingVideo) {
                        setPlayingVideo({ ...v, title: videoUpdate.title });
                      }
                      return { ...v, title: videoUpdate.title };
                    } else {
                      return v;
                    }
                  });
                  break;
              }
              setVideos(vids);
              setLastVideoUpdate(Date.now());
            }}
          />
        )}
        {modalState == ModalState.config && (
          <div className="flex flex-col gap-1">
            <ConfigForm
              onSuccess={() => {
                setIsConfigMissing(false);
                setModalState(ModalState.none);
                fetchPlaylists().then((data: Playlist[]) => {
                  setVideos([]);
                  setSelectedPlaylist(data[0]);
                });
              }}
            />

            <Label htmlFor="dark-mode-button"> Dark/Light </Label>
            <Button
              type="button"
              color="neutral"
              data-testid="light-dark-toggle"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <HiOutlineSun className="text-xl" />
              ) : (
                <HiOutlineMoon className="text-xl" />
              )}
            </Button>
          </div>
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
        {isDownloadStatusMenuOpen && (
          <DownloadStatus
            isDark={darkMode}
            downloadStatuses={downloadStatuses}
          />
        )}
        <div className={playingVideo ? "dark" : ""}>
          <Navbar
            currentDownloadCount={downloadStatuses.filter(ds=>!ds.is_complete && !ds.is_cancelled && !ds.is_error).length}
            isDownloadStatusMenuOpen={isDownloadStatusMenuOpen}
            toggleDownloadStatus={() => setIsDownloadStatusMenuOpen((v) => !v)}
            toggleTheme={toggleDarkMode}
            isDarkMode={darkMode}
            openAddVideoMenu={onClickAddVideo}
            openConfigMenu={() => setModalState(ModalState.config)}
          />
        </div>
        {!playingVideo && (
          <LeftMenu
            onClickOpenEditPlaylistMenu={onClickEditPlaylist}
            onClickOpenNewPlaylistMenu={onClickNewPlaylist}
            playlists={playlists}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={(p: Playlist) => {
              setVideos([]);
              setSelectedPlaylist(p);
            }}
          />
        )}
        <main className={"pt-14" + (playingVideo ? "" : " pl-60")}>
          {selectedPlaylist && (
            <VideoGrid
              setVideos={setVideos}
              playingVideo={playingVideo}
              VideoPlayer={VideoPlayer}
              lastVideoUpdate={lastVideoUpdate}
              key={selectedPlaylist.id}
              videos={videos}
              playlist={selectedPlaylist}
              onClickEditVideo={(v: Video) => onClickEditVideo(v)}
              onTogglePlayingVideo={(v: Video | null) => setPlayingVideo(v)}
            />
          )}
        </main>
      </div>
    </GlobalContext.Provider>
  );
};

export default App;