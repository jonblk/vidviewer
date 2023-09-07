import {useCallback, useEffect, useState } from "react"; import { Video } from "../App";
import VideoGridItem from "./VideoGridItem";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface VideoGridProps {
  playlistId: number;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<Video | undefined>>;
  onClickEditVideo: (video: Video) => void
  search: string
}

// Max number of videos per fetch
const LIMIT = 25 

const VideoGrid: React.FC<VideoGridProps> = ({ playlistId, onClickOpenVideo, onClickEditVideo, search }) => {
  const [data, setData] = useState<Video[]>([]);
  const [page, setPage] = useState(1);

  const [, setIsFetching, scrollTriggerRef] = useInfiniteScroll(() => setPage(p=>p+1));

  const fetchVideos = useCallback(async () => {
    setIsFetching(true)

    if (playlistId === undefined) {
      throw "Error, playlist_id is undefined";
    }

    try {
      const response = await fetch(
        `https://localhost:8000/playlist_videos/${playlistId}?page=${page}&limit=${LIMIT}&search=${search}`
      );
      const data = (await response.json()) as Video[];

      if (page > 1) {
        setData(d => [...d,...data]);
      } else {
        setData(data);
      }

    } catch (e) {
      console.log(e)
    }

    setIsFetching(false)
  }, [playlistId, page, setIsFetching, search]);

  useEffect(() => {
      setPage(0)
  }, [search])

  useEffect(() => {
    console.log("Fetching videos")
    fetchVideos().catch((e) => console.log(e));
  }, [fetchVideos]);

  return (
    <div className="flex flex-wrap pr-10 pt-2">
      {data.map((video) => {
        return (
          <div key={video.id} className="w-full md:w-1/2 lg:w-1/3 pl-4 mb-12">
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