package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
	"vidviewer/middleware"
	"vidviewer/repository"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

func getPlaylistRepo(r *http.Request) repository.PlaylistRepository{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).PlaylistRepo
}

func getPlaylistVideoRepo(r *http.Request) repository.PlaylistVideoRepository{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).PlaylistVideoRepo
}

type VideoPlaylist struct {
	ID      int64    `json:"id"`
	Checked bool   `json:"checked"`
	Name    string `json:"name"`
}

func UpdateVideoPlaylists(repo repository.PlaylistVideoRepository, videoID int64, playlists []VideoPlaylist) {
    for _, playlist := range playlists {
		_, err := repo.Get(playlist.ID, videoID)

		if !playlist.Checked {
			// Delete if it exists
			if err == nil {
				repo.Delete(playlist.ID, videoID)
			}
		} else {
			//  Create if it doesn't exist
			if err != nil {
				repo.Create(playlist.ID, videoID)
			}
		}
	}
}

func GetAllPlaylists(w http.ResponseWriter, r *http.Request) {
	repo := getPlaylistRepo(r)

	playlists, err := repo.Index()

	if err != nil {
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
	repo := getPlaylistRepo(r)

	// Retrieve the ID parameter from the request URL
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, err := strconv.ParseInt(idParam, 10, 64)
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

	err = repo.Update(id, playlistUpdate.Name)
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
	repo := getPlaylistRepo(r)

	var formData FormData

	err := json.NewDecoder(r.Body).Decode(&formData)
	if err != nil {
		// Handle the error
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	name := formData.Name
	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")

	err = repo.Create(name, formattedTime)

	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Println("Playlist row inserted successfully")
}

func DeletePlaylist(w http.ResponseWriter, r *http.Request) {
	playlistRepo := getPlaylistRepo(r)
	playlistVideoRepo := getPlaylistVideoRepo(r)

	// Get the playlist ID from the request URL parameters
	idstr := mux.Vars(r)["id"]
	id, err := strconv.ParseInt(idstr, 10, 64)

	if err != nil {
		http.Error(w, "Invalid playlist id", http.StatusBadRequest)
	}

	err = playlistVideoRepo.Delete(id, -1)

	if err != nil {
		http.Error(w, "Failed to delete playlistvideos", http.StatusInternalServerError)
	}

	// Delete the playlist from the database based on the ID
	err = playlistRepo.Delete(id)

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

func GetVideoPlaylists(w http.ResponseWriter, r *http.Request) {
	repo := getPlaylistRepo(r)
	// Get the playlist ID from the URL path
	vars := mux.Vars(r)
	playlistIDStr := vars["id"]

	// Convert the playlist ID to an integer
	videoID, err := strconv.ParseInt(playlistIDStr, 10, 64)
	if err != nil {
		log.Println("Invalid video ID")
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	playlists, err := repo.GetAllFromVideo(videoID)
	if err != nil {
		log.Println("Error getting videos playlists")
		http.Error(w, "Error getting videos playlists", http.StatusInternalServerError)
		return 
	}

	// Convert the videos slice to JSON
	jsonData, err := json.Marshal(playlists)
	if err != nil {
		log.Println(err)
		http.Error(w, "Error converting video's playlists to json", http.StatusInternalServerError)
		return 
	}

	// Set the response headers and write the JSON data to the response
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}