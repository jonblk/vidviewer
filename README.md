# vidviewer 
 
Vidviewer is a simple way to download, organize, and watch your [yt-dlp](https://github.com/yt-dlp/yt-dlp) videos.  

Run locally from a go binary.  

![vidviewer2](https://github.com/jonblk/vidviewer/assets/132053602/6e885be6-a820-4c28-a7b2-6fcbcf447bec)

## Features

- Dark/light mode
- Video resolution options
- Playlists

## Requirements

The following should be preinstalled:
- [mkcert](https://github.com/FiloSottile/mkcert) 
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

Videos are given a random file_id and are saved in the following structure in the file system: rootFolder/files/ab/cd/ef/abcdefghijkl.mp4. Thumbnail images are also saved in this manner in the same directory (abcdefghijkl.jpg).  

The rootFolder also contains the sqlite database and a temp folder for in-progress downloads.

## TODO 

- improve react performance 
- download progress widget with 'cancel download' option 
- import video files from disk
- user login? 
- file format options? (currently it defaults to mp4) 
- export videos 
- <s>SSL</s>
- <s>infinite scroll </s>
- <s>'all videos' view option</s>
- <s>video resolution options</s>
- <s>error messages if ffmpeg and yt-dlp not found on system</s>