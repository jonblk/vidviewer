<h1 align="center"> Vidviewer </h1> 
 
<p align="center"> Organize, download and watch videos on your computer.</p>

<p align="center"> Vidviewer is a locally run video streaming server (and web client) that integrates with yt-dlp. //in development// </p>

![banner](https://github.com/jonblk/vidviewer/assets/132053602/128f7293-5931-4dbf-8805-c118a415f7fc)

## Features

- Import videos from disk (webm, mp4)
- Search videos
- Create playlists
- Dark/light mode
- Download videos with yt-dlp  
- Choose resolution when downloading

## Dependencies

- [mkcert](https://github.com/FiloSottile/mkcert)
- [ffmpeg](https://github.com/FFmpeg/FFmpeg) 
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) 

## Develop

Run dev servers: 
- `go run runner/main.go --mode=dev`

Run tests:
- `go run runner/main.go --mode=test --cypress_mode=open` (opens cypress)
- `go run runner/main.go --mode=test` (runs cypress in headless mode)
