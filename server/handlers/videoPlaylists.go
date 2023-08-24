package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"vidviewer/middleware"
	"vidviewer/models"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

type PlaylistItem struct {
    Id int `json:"id"`
	Name    string `json:"name"`
}

type VideoPlaylist struct {
	ID      int    `json:"id"`
	Checked bool   `json:"checked"`
	Name    string `json:"name"`
}

func UpdateVideoPlaylists(db *sql.DB, videoID int, playlists []VideoPlaylist) {
  for _, playlist := range playlists {
		if !playlist.Checked {
			// Check if the row exists before trying to delete it
			row := db.QueryRow("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?", playlist.ID, videoID)
			var id int
			err := row.Scan(&id)
			if err != nil {
				continue
			}

			// Delete the row from the table
			_, err = db.Exec("DELETE FROM playlist_videos WHERE id = ?", id)
			if err != nil {
				log.Printf("Failed to delete row with ID %d: %v", id, err)
			}
		} else {
			// Check if the row exists before trying to insert it
			row := db.QueryRow("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?", playlist.ID, videoID)
			var id int
			err := row.Scan(&id)
			if err == nil {
				continue
			}

			// Update the row in the table
			_, err = db.Exec("INSERT INTO playlist_videos (playlist_id, video_id) VALUES (?, ?)", playlist.ID, videoID)
			if err != nil {
				log.Printf("Failed to update row with playlist_id %d and video_id %d: %v", playlist.ID, videoID, err)
			} 
		}
	}
}

func GetVideoPlaylists(w http.ResponseWriter, r *http.Request) {
	db := r.Context().Value(middleware.DBKey).(*sql.DB)

	// Get the playlist ID from the URL path
	vars := mux.Vars(r)
	playlistIDStr := vars["id"]

	// Convert the playlist ID to an integer
	videoID, err := strconv.Atoi(playlistIDStr)
	if err != nil {
		log.Println("Invalid video ID")
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	query := `
	SELECT p.*
	FROM playlists AS p
	JOIN playlist_videos AS pv ON p.id = pv.playlist_id
	WHERE pv.video_id = ?
	`

	// Query the database to get all columns from the playlist with the join
	rows, err := db.Query(query, videoID)

	if err != nil {
		log.Fatal(err)
	}

	defer rows.Close()

	playlists := []PlaylistItem{}

	// Iterate over the rows and populate the videos slice
	for rows.Next() {
	    playlistItem := PlaylistItem{}
		var p models.Playlist
		 err := rows.Scan(&p.ID, &p.Name, &p.Date)
		if err != nil {
			log.Fatal(err)
		}
		playlistItem.Name = p.Name
		playlistItem.Id = p.ID
		playlists = append(playlists, playlistItem)
	}

	// Check for any errors during iteration
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	// Convert the videos slice to JSON
	jsonData, err := json.Marshal(playlists)
	if err != nil {
		log.Fatal(err)
	}

	// Set the response headers and write the JSON data to the response
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}