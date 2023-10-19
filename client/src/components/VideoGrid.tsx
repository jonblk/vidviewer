import { useCallback, useEffect, useState } from "react"; import { Video } from "../App";
import VideoGridItem from "./VideoGridItem";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import Spinner from "./Spinner";
import Input from "./Input";
import Dropdown  from "./Dropdown";

interface VideoGridProps {
  playlistId: number;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<Video | undefined>>;
  onClickEditVideo: (video: Video) => void
}

// Max number of videos per fetch
const LIMIT = 25 

const sortOptions = [{label: "Latest", value: 0}, {label: "Oldest", value: 1}]

interface VideoGridState {
  data: Video[],
  page: number,
  search: string,
  position: number
  sortBy: number 
}

const saveGridState = (state: VideoGridState) => {
  localStorage.setItem("videoGridState", JSON.stringify(state));
}

export const resetVideoGridData = () => {
  const state =  getGridState()
  if (state) {
    state.data = [];
    state.page = 1;
    state.position = 0;
    localStorage.setItem("videoGridState", JSON.stringify(state))
  }
}

const getGridState = () => {
  const state = localStorage.getItem("videoGridState");
  if (state) {
    try {
      return JSON.parse(state) as VideoGridState;
    } catch {
      return null;
    }
  } else {
    return null
  }
}

/*
   Displays the videos belonging to a playlist.
   When a video is clicked, the videoGrid state is saved to localStorage. 
*/
const VideoGrid: React.FC<VideoGridProps> = ({ playlistId, onClickOpenVideo, onClickEditVideo}) => {
  const [data, setData] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(0)
  const [savedPosition, setSavedPosition] = useState(0);
  const [position, setPosition, isFetching, setIsFetching, setHasMore, scrollTriggerRef] = useInfiniteScroll(handleScrollToBottom);

  // When user scrolls to bottom of page
  function handleScrollToBottom() {
    fetchVideos(page + 1, search, sortBy).catch(e => console.log(e))
    setPage(p=>p+1)
  }

  // When user clicks sortBy
  function handleSortByUpdate(value: number) {
    setSortBy(value)
    setPage(1)
    setPosition(0)
    setHasMore(true);
    saveGridState({ data, sortBy: value, page: 1, search, position: 0})
    fetchVideos(1, search, value).catch(e => console.log(e))
     window.scrollTo(0, savedPosition)
  }

  // When user updates search input
  const handleSearchUpdate = (text: string) => {
    setSearch(text);
    if (text.length !== 1) {
      setPage(1);
      setHasMore(true);
      fetchVideos(1, text, sortBy).catch(e => console.log(e))
    }
    saveGridState({ data, sortBy, page, search: text, position})
  }

  const fetchVideos = useCallback(async (page: number, search: string, sortBy: number) => {
    setIsFetching(true);

    try {
      const response = await fetch(
        `https://localhost:8000/playlist_videos/${playlistId}?page=${page}&limit=${LIMIT}&search=${search}&sortBy=${sortBy}`
      );

      const data = (await response.json()) as Video[];

      if (data.length < LIMIT) {
        setHasMore(false);
      }

      if (page > 1) {
        setData((d) => [...d, ...data]);
      } else {
        setData(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsFetching(false);
    }
  }, [playlistId, setHasMore, setData, setIsFetching])
  
  // Scroll to previous position
  // Use 'savedPosition' to avoid calling scrollTo everytime the user scrolls
  useEffect(
    () => window.scrollTo(0, savedPosition)
    , [savedPosition]
  );

  // On initial render
  // Load saved state, and/or fetch videos 
  useEffect(() => {
    const savedState = getGridState();
    
    if (savedState) {
      setData(savedState.data)
      setSearch(savedState.search)
      setPage(savedState.page)
      setPosition(savedState.position)
      setSavedPosition(savedState.position)
      setSortBy(savedState.sortBy)
    } 

    if (savedState && savedState.data.length === 0) {
      fetchVideos(1, savedState.search, savedState.sortBy).catch(e=>console.log(e))
    }

    if (!savedState) {
      fetchVideos(1, "", sortBy).catch(e=>console.log(e))
    }
  }, [fetchVideos, setData, setSearch, setPage, setPosition, setSavedPosition])

  return (
    <>
    <div className="fixed top-0 w-[340px] z-20 p-2 ml-2 flex gap-3">
      <div className="">
      <Input
        type="search"
        transparent={true}
        label="vsearch"
        onChange={(e) => handleSearchUpdate(e.target.value)}
        value={search}
        id="search"
      />
      </div>
      
      <div className="w-[30%]">
      <Dropdown 
        selected={sortOptions[sortBy]}
        onSelect={v => handleSortByUpdate(v.value as number)}
        isFetching={false}
        disabled={false}
        options={sortOptions}
      /></div>
    </div>
    <div className="flex flex-wrap pr-10 pt-2">
      { /* Render video thumbnails */ }
      {
        data.map((video) => (
          <div key={video.id} className="w-full pl-4 md:w-1/2 lg:w-1/4 mb-8">
            <VideoGridItem
              {...{
                ...video,
                video: video,
                onClickEditVideo,
                onClickOpenVideo: v =>{ saveGridState({ data, sortBy, page, search, position}); onClickOpenVideo(v)},
              }}
            />
          </div>
        ))
      }

      {/* Show message if seach input returns no results */ }
      {
        (data.length === 0 && search.length > 1) &&
        <p className="pl-4">
          No videos found: <span className="text-neutral-400">"{search}"</span>
        </p>
      }
      <div ref={scrollTriggerRef} id="infinite-scroll-trigger"></div>
    </div>

    {
      isFetching && 
      <div className="flex pt-4 pb-8 justify-center">
        <Spinner  />
      </div>
    }
    </>
  );
};

export default VideoGrid;