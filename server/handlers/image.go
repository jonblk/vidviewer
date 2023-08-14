package handlers

import (
	"net/http"
	"os"
	"strconv"
	"vidviewer/config"
	"vidviewer/db"
	"vidviewer/files"
	"vidviewer/models"

	"github.com/gorilla/mux"

	_ "github.com/mattn/go-sqlite3"
)

const image_format = "jpg"

func GetImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	videoIDStr := vars["video_id"]

	// Convert the video ID to an integer
	videoID, err := strconv.Atoi(videoIDStr)
	if err != nil {
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	rootFolderPath := config.Load().FolderPath

	video := models.Video{}

	err = db.SQL.QueryRow("SELECT * FROM videos WHERE id = ?", videoID).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate)

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
