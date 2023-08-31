import {useCallback, useEffect, useState } from "react"; import { Video } from "../App";
import VideoGridItem from "./VideoGridItem";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface VideoGridProps {
  playlistId: number;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<Video | undefined>>;
  onClickEditVideo: (video: Video) => void
}

// Max number of videos per fetch
const LIMIT = 25 

const VideoGrid: React.FC<VideoGridProps> = ({ playlistId, onClickOpenVideo, onClickEditVideo }) => {
  const [data, setData] = useState<Video[]>([]);
  const [page, setPage] = useState(1);

  const fetchVideos = async (id: number | undefined, page: number, limit: number ) => {
    if (id === undefined) {
      throw "Error, playlist_id is undefined";
    }

    try {
      const response = await fetch(
        `https://localhost:8000/playlist_videos/${id}?page=${page}&limit=${limit}`
      );
      const data = (await response.json()) as Video[];
      setData(d=> [...d,...data]);
    } catch (e) {
      console.log(e)
    }
  };

  const [, setIsFetching, scrollTriggerRef] = useInfiniteScroll(() => setPage(p=>p+1));

  const fetchCallback = useCallback(async () => {
    setIsFetching(true)
    await fetchVideos(playlistId, page, LIMIT)
    setIsFetching(false)
  }, [playlistId, page, setIsFetching]);


  useEffect(() => {
    console.log("Fetching videos ");
    fetchCallback().catch((e) => console.log(e));
   
  }, [playlistId, fetchCallback]);


  return (
    <div className="flex flex-wrap pr-10 pt-2">
      {data.map((video) => {
        return (
          <div key={video.id} className="w-full md:w-1/3 xl:w-1/4 pl-4 mb-6">
            <VideoGridItem
              {...{
                ...video,
                video: video,
                onClickEditVideo,
                onClickOpenVideo,
              }}
            />
            <div ref={scrollTriggerRef} id="infinite-scroll-trigger"></div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;