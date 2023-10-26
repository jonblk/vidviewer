import { Playlist, Video } from "../src/App";

export const playlistData: Playlist[] = [
  { id: 1, name: "Playlist 1" },
  { id: 2, name: "Playlist 2" },
  { id: 3, name: "Playlist 3" },
  { id: 4, name: "Playlist 4" },
  { id: 5, name: "Playlist 5" },
];

export const videoData: Video[] = [
  {
    id: 1,
    file_id: "12345678",
    file_path: "video1.mp4",
    thumbnail_path: "thumbnail1.jpg",
    title: "Video 1",
    duration: "00:05:30",
    url: "https://example.com/video1",
    removed: false
  },
];
