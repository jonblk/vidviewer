# vidviewer 
 
Vidviewer is a simple way to organize, download and watch videos on your computer.  

![file](https://github.com/jonblk/vidviewer/assets/132053602/2e3477c1-0e8d-437b-b06e-e5bbdab1df18)

## Features

- Download videos with ytp  
- Dark/light mode
- Import videos from disk (webm, mp4)
- Search videos
- Create playlists

## Requirements

The following should be preinstalled:
- [mkcert](https://github.com/FiloSottile/mkcert)  For local SSL connections
- ffmpeg 
- yt-dlp 

## Stack: 

- go     
- reactjs  
- sqlite 

## Development

Run the server in dev mode: `Go run . -dev`.  This allows cors on port :5173.  Run the react dev server: `npm run dev 5173`.

HTML files and assets are served from port 8000 when running the production server.  

To compile: 

- Build the frontend: `npm run build`
- Before building the production binary create a `server/build` directory with the frontend build. 
- Compile production build: `GOOS=linux GOARCH=amd64 go build main.go`

## Current Implementation

The user selects a `rootFolder` which gets populated with an sqlite database, a `files` folder (for videos and thumbnails) and a `temp` folder for in-progress downloads.

Videos are given a random file_id and are saved in the following structure: `rootFolder/files/ab/cd/ef/abcdefghijkl.mp4`. Thumbnail images are also saved in this manner in the same directory `rootFolder/files/ab/cd/ef/abcdefghijkl.jpg`.  

 
