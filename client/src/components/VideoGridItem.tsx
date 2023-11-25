import React, { useContext, useState } from "react";
import { FiMoreHorizontal, FiPlay } from "react-icons/fi";
import { Video } from "../App";
import { formatSeconds } from "../util";
import GlobalContext from "../contexts/GlobalContext";

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
  const rootURL = useContext(GlobalContext)?.rootURL

  return (
    <div>
      <div
        data-testid={`video-thumbnail-${video.title}`}
        className="flex flex-col relative gap-1 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full relative aspect-video bg-black overflow-hidden rounded-lg">
          <img
            src={`${rootURL}/images/${video.file_id}`}
            alt={title}
            className="w-full rounded-lg object-center object-cover h-full"
          />
          <div className="absolute bg-black rounded-br-lg p-0.5 px-2 text-xs font-semibold text-neutral-200 top-0">
            {formatSeconds(duration)}
          </div>
        </div>
        {isHovered && (
          <div
            data-testid={`video-hovered-thumbnail-${video.title}`}
            onClick={() => onClickOpenVideo(video)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg hover:cursor-pointer"
          >
            <FiPlay data-testid="video-item-play-icon" size={40} color="#f1f1f1f1" />
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClickEditVideo(video);
              }}
              className="absolute bg-none hover:cursor-pointer  rounded-tr-lg rounded-bl-lg p-0.5 px-2 text-xs font-semibold text-white text-opacity-50 hover:text-opacity-100 top-0 right-0 z-10 "
            >
              <FiMoreHorizontal data-testid="video-item-more-icon" size={"1.1rem"} />
            </div>
          </div>
        )}
      </div>

      <h3
        className="mt-2  dark:text-neutral-200 "
        data-testid={`download-date=${video.download_date}`}
      >
        {title.length > 45 ? title.slice(0, 65) + "..." : title}
      </h3>
    </div>
  );
};

export default GridItem;
