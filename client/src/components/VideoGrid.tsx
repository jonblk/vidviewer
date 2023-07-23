import VideoGridItem from "./VideoGridItem";

interface VideoGridProps {
  selectedPlaylistID: number | null;
  onClickOpenVideo: React.Dispatch<React.SetStateAction<number | null>> 
}

const VideoGrid: React.FC<VideoGridProps> = ({ selectedPlaylistID, onClickOpenVideo }) => {
  // Fetch the videos
  // const temporaryVideos = fetch(selectedPlaylistID);
    const temporaryVideos = [{
        id: 303003003,
        ytID: "234234",
        title: "Title",
        thumbnail: "4324234",
        duration: 4303,
    }]

  return (
    <div className="flex flex-wrap">
      {temporaryVideos.map((videoItem) => (
        <div key={videoItem.id} className="w-full md:w-1/3 xl:w-1/4 pl-4 mb-6">
          <VideoGridItem {...{...videoItem, onClickOpenVideo}} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;