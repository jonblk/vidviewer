import { Video } from "./App";

export interface CachedVideoGrid {
 videos: Video[];
 page: number;
 search: string
 position: number;
 reset: () => void;
}

export const cachedVideoGrid: CachedVideoGrid = {
 videos: [],
 page: 1,
 search: '',
 position: 0,
 reset: function() {
   this.videos = [];
   this.search = '';
   this.page = 1;
   this.position = 0;
 }
};