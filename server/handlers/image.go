package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strconv"
	"vidviewer/config"
	"vidviewer/files"
	"vidviewer/middleware"
	"vidviewer/models"

	"github.com/gorilla/mux"

	_ "github.com/mattn/go-sqlite3"
)

const image_format = "jpg"

func GetImage(w http.ResponseWriter, r *http.Request) {
	db := r.Context().Value(middleware.DBKey).(*sql.DB)

    // Get config from context
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath  // Type assert to your config type

	vars := mux.Vars(r)
	videoIDStr := vars["video_id"]

	// Convert the video ID to an integer
	videoID, err := strconv.Atoi(videoIDStr)
	if err != nil {
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	video := models.Video{}

	err = db.QueryRow("SELECT * FROM videos WHERE id = ?", videoID).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)

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
