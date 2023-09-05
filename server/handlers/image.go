package handlers

import (
	"net/http"
	"os"
	"vidviewer/config"
	"vidviewer/files"
	"vidviewer/middleware"

	"vidviewer/repository"

	"github.com/gorilla/mux"

	_ "github.com/mattn/go-sqlite3"
)

const image_format = "jpg"

func GetImage(w http.ResponseWriter, r *http.Request) {
	repo := r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).VideoRepo

    // Get config from context
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath  // Type assert to your config type

	vars := mux.Vars(r)
	fileID := vars["file_id"]

	video, err := repo.GetBy(fileID, "file_id")

	if err != nil {
		http.Error(w, "Video not found", http.StatusNotFound)
		return
	}

	path := files.GetFilePath(rootFolderPath, video.FileID, image_format)

	// Open the video file
	image, err := os.Open(path)

	if err != nil {
		http.Error(w, "Failed to open image file", http.StatusInternalServerError)
		return
	}

	defer image.Close()

	  // Get the file's information
    fileInfo, err := image.Stat()
    if err != nil {
        http.Error(w, "Failed to get file information", http.StatusInternalServerError)
        return
    }

	// Set the Cache-Control header to enable caching for 1 hour
    w.Header().Set("Cache-Control", "public, max-age=31536000")
	
    http.ServeContent(w, r, video.FileID+"."+image_format, fileInfo.ModTime(), image)
}
