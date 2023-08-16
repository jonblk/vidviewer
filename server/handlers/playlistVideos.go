package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"vidviewer/db"
	"vidviewer/middleware"
	"vidviewer/models"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

const ALL_PLAYLIST_ID = 0;

type VideoItem struct {
	FilePath string `json:"file_path"`
    SongPath string `json:"song_path"`
	Title    string `json:"title"`
	Duration    string `json:"duration"`
	Url    string `json:"url"`
}

func DeletePlaylistVideosGivenPlaylist(playlist_id int) error {

	// Prepare the DELETE statement
	stmt, err := db.SQL.Prepare("DELETE FROM playlist_videos WHERE playlist_id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	// Execute the DELETE statement with the ID parameter
	_, err = stmt.Exec(playlist_id)
	if err != nil {
		return err
	}

	return nil
}

func DeletePlaylistVideosFromDB(video_id int, db *sql.DB) error {
	// Prepare the DELETE statement
	stmt, err := db.Prepare("DELETE FROM playlist_videos WHERE video_id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	// Execute the DELETE statement with the ID parameter
	_, err = stmt.Exec(video_id)
	if err != nil {
		return err
	}

	return nil
}

func GetPlaylistVideos(w http.ResponseWriter, r *http.Request) {
	db := r.Context().Value(middleware.DBKey).(*sql.DB)

	// Get the playlist ID from the URL path
	vars := mux.Vars(r)
	playlistIDStr := vars["id"]

	// Convert the playlist ID to an integer
	playlistID, err := strconv.Atoi(playlistIDStr)
	if err != nil {
		log.Println("Invalid playlist ID")
		http.Error(w, "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	var query string

	if (ALL_PLAYLIST_ID != playlistID) {
		query = `
		SELECT v.*
		FROM videos AS v
		JOIN playlist_videos AS pv ON v.id = pv.video_id
		WHERE pv.playlist_id = ?
	    `
	} else {
		query = "SELECT * FROM videos WHERE download_complete = 0"
	}

	// Query the database to get all columns from the playlist with the join
	rows, err := db.Query(query, playlistID)

	if err != nil {
		log.Fatal(err)
	}

	defer rows.Close()

	// Create a slice to store the videos

	type VideoItem struct {
		YtID             string `json:"yt_id"`
		ID               int    `json:"id"`
		Url              string `json:"url"`
		FileID           string `json:"file_id"`
		FileFormat       string `json:"file_format"`
		Title            string `json:"title"`
		DownloadComplete bool   `json:"download_complete"`
		Duration         string    `json:"duration"`
		DownloadDate     string `json:"download_date"`
		FilePath         string `json:"file_path"`
		ThumbnailPath    string `json:"thumnail_path"`
	}

	videos := []VideoItem{}

	// Iterate over the rows and populate the videos slice
	for rows.Next() {
	    videoItem := VideoItem{}
		var video models.Video
		 err := rows.Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate)
		if err != nil {
			log.Fatal(err)
		}
		videoItem.DownloadComplete = video.DownloadComplete
		videoItem.ID = video.ID
		videoItem.Title = video.Title
		videoItem.Duration = video.Duration
		videoItem.Url = video.Url
		videos = append(videos, videoItem)
	}

	// Check for any errors during iteration
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	// Convert the videos slice to JSON
	jsonData, err := json.Marshal(videos)
	if err != nil {
		log.Fatal(err)
	}

	// Set the response headers and write the JSON data to the response
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}