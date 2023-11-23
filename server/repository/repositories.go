package repository

type Repositories struct {
    VideoRepo    VideoRepository
    PlaylistRepo PlaylistRepository
    PlaylistVideoRepo PlaylistVideoRepository
}

func NewRepositories() *Repositories {
	videoRepo    := VideoRepository{}
	playlistRepo := PlaylistRepository{}
	playlistVideoRepo := PlaylistVideoRepository{}

    return &Repositories{
        VideoRepo:   videoRepo,
        PlaylistRepo: playlistRepo,
        PlaylistVideoRepo: playlistVideoRepo,
    }
}

