import { defineConfig } from "cypress";

import {readdirSync} from "fs";
import {parse} from "path";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, _) {
      on("task", {
        "getFiles": (folderPath: string) => {
          const files = readdirSync(folderPath);
          return files.map((file: string) => parse(file).name);
        },
      });
    },
  },
  env: {
    playlists: [
      "All",
      "playlist1",
      "playlist2",
      "playlist3",
      "playlist4",
      "playlist5",
      "playlist6",
      "playlist7",
      "random",
      "test-delete",
    ],
    root_url: `https://localhost:${process.env.CYPRESS_SERVER_PORT}`,
    ...process.env,
  },
});
