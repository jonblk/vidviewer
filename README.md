# vidviewer 
 
Vidviewer is a simple way to download, organize, and watch your [yt-dlp](https://github.com/yt-dlp/yt-dlp) videos.  

Run locally from a go binary.  
![vidviewer](https://github.com/jonblk/vidviewer/assets/132053602/571abe64-ef30-407f-9b93-55b0f3db22f1)

## Features

- Dark/light mode
- Import videos from disk (webm, mp4)
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

 
- download progress widget with 'cancel download' option 
- user login? 
- file format options? (currently it defaults to mp4) 
- export videos 
- improve react performance
- <s>search function</s>
- <s>import video files from disk</s>
- <s>SSL</s>
- <s>infinite scroll </s>
- <s>'all videos' view option</s>
- <s>video resolution options</s>
- <s>error messages if ffmpeg and yt-dlp not found on system</s>
