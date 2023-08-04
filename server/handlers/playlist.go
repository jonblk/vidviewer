package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
	"vidviewer/db"
	"vidviewer/models"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

func UpdateRootFolderPath(w http.ResponseWriter, r *http.Request) {
	log.Println("yo sup dawg")
}

func GetAllPlaylists(w http.ResponseWriter, r *http.Request) {
	// Query all playlists from the database
	rows, err := db.SQL.Query("SELECT * FROM playlists")
	if err != nil {
		http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
		return
	}

	defer rows.Close()

	// Create a slice to store the playlists
	playlists := []models.Playlist{}

	// Iterate over the rows and scan each playlist into a struct
	for rows.Next() {
		var playlist models.Playlist
		err := rows.Scan(&playlist.ID, &playlist.Name, &playlist.Date)
		if err != nil {
			log.Println(err.Error())
			http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
			return
		}
		playlists = append(playlists, playlist)
	}

	// Check for any errors during iteration
	if err := rows.Err(); err != nil {
		log.Println(err.Error())
		http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
		return
	}

	// Convert the playlists slice to JSON
	jsonPlaylists, err := json.Marshal(playlists)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, "Failed to fetch playlists", http.StatusInternalServerError)
		return
	}

	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonPlaylists)
}

type PlaylistUpdate struct {
	Name string `json:"name"`
}

func UpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	// Retrieve the ID parameter from the request URL
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Parse the JSON request body
	var playlistUpdate PlaylistUpdate
	err = json.NewDecoder(r.Body).Decode(&playlistUpdate)
	if err != nil {
		http.Error(w, "Failed to parse JSON body", http.StatusBadRequest)
		return
	}

	// Prepare the SQL update statement
	stmt, err := db.SQL.Prepare("UPDATE playlists SET name = ? WHERE id = ?")
	if err != nil {
		http.Error(w, "Failed to prepare update statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	// Execute the update statement with the retrieved values
	_, err = stmt.Exec(playlistUpdate.Name, id)
	if err != nil {
		http.Error(w, "Failed to update playlist", http.StatusInternalServerError)
		return
	}

	// Return a success message
	fmt.Fprintf(w, "Playlist updated successfully")
}

type FormData struct {
	Name string `json:"name"`
}

func CreatePlaylist(w http.ResponseWriter, r *http.Request) {
	// Prepare the SQL statement for inserting a row
	stmt, err := db.SQL.Prepare("INSERT INTO playlists (name, date) VALUES (?, ?)")

	if err != nil {
		log.Println(err)
	}

	var formData FormData

	err = json.NewDecoder(r.Body).Decode(&formData)
	if err != nil {
		// Handle the error
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	name := formData.Name
	log.Println(name)

	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")

	// Execute the SQL statement with the values for the row
	_, err = stmt.Exec(name, formattedTime)

	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Println("Playlist row inserted successfully")
}

func DeletePlaylist(w http.ResponseWriter, r *http.Request) {
	// Get the playlist ID from the request URL parameters
	vars := mux.Vars(r)
	id := vars["id"]

	// Delete playlist_videos 
	stmt, err := db.SQL.Prepare("DELETE FROM playlist_videos WHERE playlist_id = ?")

	if err != nil {
		http.Error(w, "Failed to delete playlist videos", http.StatusInternalServerError)
	}

	defer stmt.Close()

	_, err = stmt.Exec(id)
	if err != nil {
		http.Error(w, "Failed to delete playlist videos", http.StatusInternalServerError)
	}

	// Delete the playlist from the database based on the ID
	err = deletePlaylistFromDB(id)

	if err != nil {
		// Check if the error is due to playlist not found
		if err == sql.ErrNoRows {
			// Return a 404 Not Found response
			http.Error(w, "Playlist not found", http.StatusNotFound)
		} else {
			// Return a 500 Internal Server Error response
			http.Error(w, "Failed to delete playlist", http.StatusInternalServerError)
		}
		return
	}

	// Return a 204 No Content response to indicate successful deletion
	w.WriteHeader(http.StatusNoContent)
}

func deletePlaylistFromDB(id string) error {
	// Prepare the DELETE statement
	stmt, err := db.SQL.Prepare("DELETE FROM playlists WHERE id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	// Execute the DELETE statement with the ID parameter
	_, err = stmt.Exec(id)
	if err != nil {
		return err
	}

	return nil
}
