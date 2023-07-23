
import React, { useState } from 'react';
import { FiPlay } from 'react-icons/fi';
import { IoMdPlayCircle } from 'react-icons/io';

interface GridItemProps {
  id: number;
  ytID: string;
  title: string;
  thumbnail: string;
  duration: number;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<number | null>>;
}

const GridItem: React.FC<GridItemProps> = ({ id, ytID, title, thumbnail, duration, onClickOpenVideo }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <div
        className="flex flex-col relative gap-1 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img  src={thumbnail} alt={title} className="w-full rounded-lg" />
        {isHovered && (
          <div onClick={() => onClickOpenVideo(134234)} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg hover:cursor-pointer">
            <FiPlay size={40} color="#fff" />
          </div>
        )}
      </div>

      <h3 className="mt-2">{title}</h3>
    </div>
  );
};

export default GridItem;