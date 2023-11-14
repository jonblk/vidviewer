import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite';
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({mode}: { mode: string }) => {
  // load env data from parent folder
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  // define env variables
 return defineConfig({
  server: {
    port: parseInt(env.CLIENT_DEV_PORT, 10),
    strictPort: true
  },
  define: {
   'process.env.SERVER_PORT': mode === "test" ? JSON.stringify(env.SERVER_PORT_TEST) : JSON.stringify(env.SERVER_PORT),
   'process.env.CLIENT_DEV_PORT': mode === "test" ? JSON.stringify(env.CLIENT_DEV_PORT_TEST) : JSON.stringify(env.CLIENT_DEV_PORTT),
  },
  plugins: [react()],
  build: {
    minify: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
})
};
