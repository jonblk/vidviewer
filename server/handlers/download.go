package handlers

import (
	"log"
	"net/http"
	"vidviewer/config"
	"vidviewer/downloadManager"
	"vidviewer/files"
	"vidviewer/middleware"

	"github.com/gorilla/mux"
)

func ResumeDownload(w http.ResponseWriter, r *http.Request) {
	repositories := GetRepositories(r)
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath
	dm := r.Context().Value(middleware.DownloadManagerKey).(*downloadManager.DownloadManager)
	videoRepo := repositories.VideoRepo
	playlistVideoRepo :=  repositories.PlaylistVideoRepo
	tempFolderPath := files.GetTemporaryFolderPath(rootFolderPath)

	vars := mux.Vars(r)
	videoId := vars["video_id"]

	if videoId == "" {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	video, err := videoRepo.Get(videoId)

	if (err != nil) {
		log.Println("Could not find video with id: ", videoId)
		http.Error(w, "Video not found", http.StatusBadRequest)
	}

	LoadVideoWithYtdlp(
		*video,
		playlistVideoRepo,
		videoRepo,
		rootFolderPath,
		tempFolderPath,
		dm,
	)
}

func CancelDownload(w http.ResponseWriter, r *http.Request) {
	repositories := GetRepositories(r)
    dm := r.Context().Value(middleware.DownloadManagerKey).(*downloadManager.DownloadManager)
    videoRepo := repositories.VideoRepo
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath 
	playlistVideoRepo :=  repositories.PlaylistVideoRepo

	vars := mux.Vars(r)
	videoId := vars["video_id"]

	if videoId == "" {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	download, error := dm.CancelDownload(videoId)

	if error != nil  {
		http.Error(w, "Error trying to cancel download", http.StatusInternalServerError)
	} else {
		playlistVideoRepo.OnDeleteVideo(videoId)
		videoRepo.Delete(videoId) 
		files.OnCancelDownload(rootFolderPath, download.Video.FileID) // delete temp files
	}
} 