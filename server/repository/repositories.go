package repository

import (
	"database/sql"
)

type Repositories struct {
    VideoRepo    VideoRepository
    PlaylistRepo PlaylistRepository
    PlaylistVideoRepo PlaylistVideoRepository
}

func NewRepositories(activeConnection **sql.DB) *Repositories {
	videoRepo    := VideoRepository{db: activeConnection}
	playlistRepo := PlaylistRepository{db: activeConnection}
	playlistVideoRepo := PlaylistVideoRepository{db: activeConnection}

    return &Repositories{
        VideoRepo:   videoRepo,
        PlaylistRepo: playlistRepo,
        PlaylistVideoRepo: playlistVideoRepo,
    }
}

