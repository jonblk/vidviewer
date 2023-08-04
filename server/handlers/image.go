package handlers

import (
	"io"
	"log"
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
	videoFile, err := os.OpenFile(path, os.O_RDONLY, 0)

	if err != nil {
		http.Error(w, "Failed to open video file", http.StatusInternalServerError)
		return
	}
	defer videoFile.Close()

	// Set the Content-Type header to image/jpeg
	w.Header().Set("Content-Type", "image/jpeg")

	// Copy the video file to the response writer
	_, err = io.Copy(w, videoFile)
	if err != nil {
		log.Fatal(err)
	}
}