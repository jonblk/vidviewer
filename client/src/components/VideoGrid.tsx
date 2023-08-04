import { Video } from "../App";
import VideoGridItem from "./VideoGridItem";

interface VideoGridProps {
  videos: Video[];
  onClickOpenVideo: React.Dispatch<React.SetStateAction<Video | undefined>>;
  onClickEditVideo: (video: Video) => void
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onClickOpenVideo, onClickEditVideo }) => {
  return (
    <div className="flex flex-wrap pr-10 pt-2">
      {videos.map((video) => (
        <div key={video.id} className="w-full md:w-1/3 xl:w-1/4 pl-4 mb-6">
          <VideoGridItem {...{...video, video: video, onClickEditVideo, onClickOpenVideo}} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;