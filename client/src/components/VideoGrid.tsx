import {  useContext, useEffect, useRef, useState } from "react"; import { Playlist, Video } from "../App";
import VideoGridItem from "./VideoGridItem";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import Spinner from "./Spinner";
import Input from "./Input";
import Dropdown  from "./Dropdown";
import GlobalContext from "../contexts/GlobalContext";
import useFetch from "../hooks/useFetch";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { VideoPlayerProps } from "./VideoPlayer";

interface VideoGridProps {
  playingVideo: Video | null;
  VideoPlayer: React.ComponentType<VideoPlayerProps>;
  playlist: Playlist;
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  lastVideoUpdate: number;
  onClickEditVideo: (v: Video) => void;
  onTogglePlayingVideo: (video: Video | null) => void;
}

// Max number of videos per fetch
const LIMIT = 25 

const sortOptions = [{label: "Latest", value: 0}, {label: "Oldest", value: 1}]

// Displays the videos belonging to a playlist.
const VideoGrid: React.FC<VideoGridProps> = ({VideoPlayer, onTogglePlayingVideo, playingVideo, playlist, videos, setVideos, onClickEditVideo}) => {
  const rootURL = useContext(GlobalContext)?.rootURL;
  const [sortBy, setSortBy] = useLocalStorage<number>("videoGridSortBy", 0);
  const [page, setPage]     = useState(1);
  const [lastPosition, setLastPosition] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const initialRenderRef = useRef(true);

  useEffect(()=>{
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
    }
  });

  const { data, loading, error } = useFetch<Video[]>(
    `${rootURL}/playlist/${playlist.id}/videos?page=${page}&limit=${LIMIT}&search=${search}&sortBy=${sortBy}`,
    'GET',
    true,
     // avoid fetching videos on initial render 
     // IF returning to the grid from playing video:
     initialRenderRef.current && videos.length > 0 
  );

  const [position, scrollTriggerRef] = useInfiniteScroll(
    handleScrollToBottom,
    10,
    hasMore,
    lastPosition,
  );

  function handleScrollToBottom() {
    setPage(p=>p+1)
  }

  function handleSortByUpdate(value: number) {
    setSortBy(value)
    setPage(1)
    setHasMore(true);
    setVideos([]);
    setLastPosition(0)
    window.scrollTo(0, 0)
  }

  const handleSearchUpdate = (text: string) => {
    setVideos([])
    setSearch(text);
    setPage(1);
    setHasMore(true);
    window.scrollTo(0, 0)
  }

  // Handle new video fetches
  useEffect(() => {
    if (!data)
      return;

    setVideos(prev => page > 1 ? [...prev, ...data] : data);

    if (data.length < LIMIT) {
      setHasMore(false);
    }
  }, [data])

  useEffect(() => {
    window.scrollTo(0, 0)
    setHasMore(true); 
  }, [playlist.id])
  
  // Scroll to saved position
  useEffect(() => {
    if (!playingVideo)
      window.scrollTo(0, lastPosition)
  }, [playingVideo])

  return (
    <div>
    { !playingVideo ? 
    <>
    <div className="fixed top-0 w-[380px] z-20 p-2 ml-2 flex gap-3">
      <div className="">
      <Input
        type="search"
        transparent={true}
        label="vsearch"
        onChange={(e) => handleSearchUpdate(e.target.value)}
        value={search}
        id="search"
        data-testid="video-grid-search"
      />
      </div>
      
      <div className="w-[30%]">
      <Dropdown 
        id="video-grid-sort-by"
        selected={sortOptions[sortBy]}
        onSelect={v => {
          if (v.value as number !== sortBy) {
            handleSortByUpdate(v.value as number);
          }
        }}
        isFetching={false}
        disabled={false}
        options={sortOptions}
      /></div>
    </div>
    <div data-testid="video-grid-container" className="flex flex-wrap pr-10 pt-2">
      { /* Render video thumbnails */ }
      {
         videos.map((video) => {
            return !video.removed && <div data-testid={`video-grid-item-${video.title}`} key={video.id} className="w-full pl-4 md:w-1/2 lg:w-1/4 mb-8">
        
            <VideoGridItem
              {...{
                ...video,
                video: video,
                onClickEditVideo,
                onClickOpenVideo: v =>{ 
                  setLastPosition(position)
                  onTogglePlayingVideo(v)
                },
              }}
            />
          </div>
        })
      }

      {/* Show message if seach input returns no results */ }
      {
        (videos.length === 0 && search.length > 1) &&
        <p className="pl-4">
          No videos found: <span className="text-neutral-400">"{search}"</span>
        </p>
      }
      <div ref={scrollTriggerRef} id="infinite-scroll-trigger"></div>
    </div>

    <div className="flex pt-4 pb-8 justify-center">
      { loading && <Spinner /> }
      { error && <p className="text-red-500 text-xl"> Error getting videos </p> }
    </div>
    </> :
      <VideoPlayer
        video={playingVideo}
        onClose={() => onTogglePlayingVideo(null)}
        onClickEditVideo={() => onClickEditVideo(playingVideo)}
      />
    }
  </div>);
};

export default VideoGrid;