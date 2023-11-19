import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {},
  env: {
    playlists: [
      'All',
      'playlist1',
      'playlist2',
      'playlist3',
      'playlist4',
      'playlist5',
      'playlist6',
      'playlist7', 
      'random',  
    ],
    root_url: `https://localhost:${process.env.CYPRESS_SERVER_PORT}`,
    ...process.env
  }
});
