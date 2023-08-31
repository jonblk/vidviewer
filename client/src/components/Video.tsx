import React, { useRef, useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { FiPause, FiPlay } from 'react-icons/fi';
import { Video } from '../App';

interface VideoPlayerProps {
  videoId: number;
  setSelectedVideo: (v: Video | undefined) => void;
}

type VideoControls = {
  volume: number;
  muted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, setSelectedVideo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleBackButtonClick = () => {
    setSelectedVideo(undefined);
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

  const videoUrl = `https://localhost:8000/videos/${videoId}`

  // Load/Save {volume, muted} from/to localstorage
  useEffect(()=> {
    if (videoRef.current) {
      const controls: (string | null) = localStorage.getItem("video_controls");
      const parsed_controls: VideoControls = controls ? JSON.parse(controls) as VideoControls : {volume: 1, muted: false}

      // Update the video player
      videoRef.current.volume = parsed_controls.volume;
      videoRef.current.muted  = parsed_controls.muted;
    }

    const currentRef = videoRef.current;
    return(() => {
      if (currentRef) {
        localStorage.setItem(
          'video_controls', 
          JSON.stringify({
            volume: currentRef?.volume, 
            muted: currentRef?.muted
          })
        );
      }
    })
  },[])

  return (
    <div className="w-full relative bg-black flex justify-center">
      <video
        autoPlay={true}
        src={videoUrl}
        ref={videoRef}
        className="w-[55%] aspect-video bg-black "
        controls
      ></video>
      <div
        onClick={handleBackButtonClick}
        className={`hover:cursor-pointer absolute top-0 z-1 h-[30%] rounded-tl-lg rounded-tr-lg inset-0 bg-black bg-opacity-40 transition-opacity duration-100 opacity-0 hover:opacity-100`}
      >
        <div className="flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex-1">
          <button className="text-white text-opacity-80 ">
            <FaArrowLeft size="2.1rem" />
          </button>
          {false && (
            <button
              onClick={handlePlayToggle}
              className="text-white text-opacity-80 hover:text-opacity-100 bg-opacity-50 p-4"
            >
              {isPlaying ? <FiPause size="3rem" /> : <FiPlay size="3rem" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;