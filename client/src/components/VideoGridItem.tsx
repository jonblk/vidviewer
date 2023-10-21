import React, { useState } from "react";
import { FiMoreHorizontal, FiPlay } from "react-icons/fi";
import { Video } from "../App";
import { formatSeconds } from "../util";

interface GridItemProps {
  video: Video;
  title: string;
  duration: string;
  onClickOpenVideo: (v: Video) => void;
  onClickEditVideo: (video: Video) => void
}

const GridItem: React.FC<GridItemProps> = ({
  onClickEditVideo,
  video,
  title,
  duration,
  onClickOpenVideo,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <div
        className="flex flex-col relative gap-1 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full relative aspect-video bg-black overflow-hidden rounded-lg">
          <img
            src={`https://localhost:8000/images/${video.file_id}`}
            alt={title}
            className="w-full rounded-lg object-center object-cover h-full"
          />
          <div className="absolute bg-black rounded-br-lg p-0.5 px-2 text-xs font-semibold text-neutral-200 top-0">
            {formatSeconds(duration)}
          </div>
        </div>
        {isHovered && (
          <div
            onClick={() => onClickOpenVideo(video)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg hover:cursor-pointer"
          >
            <FiPlay size={40} color="#f1f1f1f1" />
            <div
              onClick={(e) => {e.stopPropagation(); onClickEditVideo(video)}}
              className="absolute bg-none hover:cursor-pointer  rounded-tr-lg rounded-bl-lg p-0.5 px-2 text-xs font-semibold text-white text-opacity-50 hover:text-opacity-100 top-0 right-0 z-10 "
            >
              <FiMoreHorizontal size={"1.1rem"}/>
            </div>
          </div>
        )}
      </div>

      <h3 data-testid={`video-grid-item-${video.id}`} className="mt-2  dark:text-neutral-200 ">
        {title.length > 45 ? title.slice(0, 65) + "..." : title}
      </h3>
    </div>
  );
};

export default GridItem;
