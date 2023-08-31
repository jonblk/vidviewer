# vidviewer (work in progress!)
 
A minimal, locally run web app for downloading, organizing, and viewing yt-dlp videos.  The server is run from a Go executable which also serves frontend assets. 

![vidviewer2](https://github.com/jonblk/vidviewer/assets/132053602/6e885be6-a820-4c28-a7b2-6fcbcf447bec)

# Features

- Dark/light mode
- Custom playlists
- Auto file management (just choose a root folder in your system)

## Stack: 

- go     
- reactjs  
- sqlite 
- ffmpeg (required)
- yt-dlp (required)

## Installation / Development

Run the server in dev mode: `Go run . -dev`.  This allows cors on port :5173.  Run the react dev server: `npm run dev 5173`.

Compile production build: `GOOS=linux GOARCH=amd64 go build main.go`

Before building the production binary replace the `server/build` directory with the frontend build. 

## Requirements

ffmpeg and yt-dlp should be preinstalled and available in PATH. 

## Current Implementation

On initial load a folder path is prompted in the terminal. 
This is the root folder for the database and downloaded files. 

Videos are given a random file_id and are saved in the following structure in the file system: rootFolder/files/ab/cd/ef/abcdefghijkl.mp4. Thumbnail images are also saved in this manner in the same directory (abcdefghijkl.jpg).  Up to 256 video files per directory (max 256^3 videos). 

The rootFolder also contains the sqlite database and a temp folder for in-progress downloads.

HTML files and assets are served from port 8000 when running the production  server.  

## TODO

- ssl 
- user login ? 
- file_format options other than mp4 ? 
- improve react performance 
- download progress widget with 'cancel download' option 
- import local files feature
- <s>infinite scroll to videos </s>
- <s>'All videos' view option</s>
- <s>video resolution options</s>
- <s>playlists checkbox list in editVideoForm</s>
- <s>settings menu (update data folder path, videos per page)</s>
- <s>error messages if ffmpeg, and yt-dlp not found on system</s>
- <s>websocket and update client when video processing complete</s>
