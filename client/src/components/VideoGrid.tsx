import { useCallback, useEffect, useState } from "react"; import { Video } from "../App";
import VideoGridItem from "./VideoGridItem";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import Spinner from "./Spinner";
import Input from "./Input";

interface VideoGridProps {
  playlistId: number;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<Video | undefined>>;
  onClickEditVideo: (video: Video) => void
}

// Max number of videos per fetch
const LIMIT = 25 

interface VideoGridState {
  data: Video[],
  page: number,
  search: string,
  position: number
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
  const [savedPosition, setSavedPosition] = useState(0);
  const [position, setPosition, isFetching, setIsFetching, setHasMore, scrollTriggerRef] = useInfiniteScroll(handleScrollToBottom);

  function handleScrollToBottom() {
    fetchVideos(page + 1, search).catch(e => console.log(e))
    setPage(p=>p+1)
  }

  const handleSearchUpdate = (text: string) => {
    setSearch(text);
    if (text.length > 1 || text.length === 0) {
      setPage(1);
      setHasMore(true);
      fetchVideos(1, text).catch(e => console.log(e))
    }
  }
  
  const saveGridState = () => {
    const currentState : VideoGridState = {data, page, position, search}
    localStorage.setItem("videoGridState", JSON.stringify(currentState));
  }

  const fetchVideos = useCallback(async (page: number, search: string) => {
    setIsFetching(true);

    try {
      const response = await fetch(
        `https://localhost:8000/playlist_videos/${playlistId}?page=${page}&limit=${LIMIT}&search=${search}`
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
  
  // Use savedPosition to avoid calling scrollTo everytime the user scrolls
  useEffect(
    () => window.scrollTo(0, savedPosition)
    , [savedPosition]
  );

  useEffect(() => {
    const savedState = getGridState();
    
    if (savedState) {
      setData(savedState.data)
      setSearch(savedState.search)
      setPage(savedState.page)
      setPosition(savedState.position)
      setSavedPosition(savedState.position)
    } else {
      fetchVideos(1, "").catch(e=>console.log(e))
    }
  }, [fetchVideos, setData, setSearch, setPage, setPosition, setSavedPosition])

  return (
    <>
    <div className="fixed top-0 w-[240px] z-50 p-2 ml-2">
        <Input
          type="search"
          transparent={true}
          label="vsearch"
          onChange={(e) => handleSearchUpdate(e.target.value)}
          value={search}
          id="search"
        />
    </div>
    <div className="flex flex-wrap pr-10 pt-2">
      {
        data.map((video) => (
          <div key={video.id} className="w-full md:w-1/2 lg:w-1/3 pl-4 mb-8">
            <VideoGridItem
              {...{
                ...video,
                video: video,
                onClickEditVideo,
                onClickOpenVideo: v =>{ saveGridState(); onClickOpenVideo(v)},
              }}
            />
          </div>
        ))
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