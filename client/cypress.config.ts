import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {},
  env: {
    root_url: `https://localhost:${process.env.CYPRESS_SERVER_PORT}`,
    ...process.env
  }
});
