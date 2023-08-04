import React, { useRef, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { FiPause, FiPlay } from 'react-icons/fi';
import { Video } from '../App';

interface VideoPlayerProps {
  videoId: number;
  setSelectedVideo: (v: Video | undefined) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, setSelectedVideo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleBackButtonClick = () => {
    setSelectedVideo(undefined);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const videoUrl = `http://localhost:8000/videos/${videoId}`
  console.log(`video url: ${videoUrl}`)

  return (
    <div className="w-full relative bg-black flex justify-center" >
      <video autoPlay={true} src={videoUrl} ref={videoRef} className="w-[55%] aspect-video bg-black " controls></video>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleBackButtonClick}
        className={`hover:cursor-pointer absolute top-0 z-1 h-[30%] rounded-tl-lg rounded-tr-lg inset-0 bg-black bg-opacity-40 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {isHovered && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-1">
            <button
              className="text-white text-opacity-80 "
            >
              <FaArrowLeft size="2.1rem" />
            </button>
            {false &&<button onClick={handlePlayToggle} className="text-white text-opacity-80 hover:text-opacity-100 bg-opacity-50 p-4">
              {isPlaying ? <FiPause size="3rem" /> : <FiPlay size="3rem" />}
            </button>
}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;