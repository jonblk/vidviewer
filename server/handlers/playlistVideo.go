package handlers

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type TogglePlaylistVideoForm struct {
	VideoID string `json:"video_id"`
	PlaylistID string `json:"playlist_id"`
}

func DeletePlaylistVideo(w http.ResponseWriter, r *http.Request) {
  // Context
  repositories := getRepositories(r)
  repo := repositories.PlaylistVideoRepo

  body, err := ioutil.ReadAll(r.Body)

  if err != nil {
	log.Println("Error reading request body")
	http.Error(w, "Error reading request body", http.StatusInternalServerError)
	return
  }

  var data TogglePlaylistVideoForm
  err = json.Unmarshal(body, &data)
  if err != nil {
		log.Println("Error parsing JSON data")
	http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
	return
  }

  err = repo.Delete(data.PlaylistID, data.VideoID)

  if err != nil {
    log.Println("Error creating playlist video")
	http.Error(w, "Error creating playlist video", http.StatusInternalServerError)
	return
  }
}

func CreatePlaylistVideo(w http.ResponseWriter, r *http.Request) {
  // Context
  repositories := getRepositories(r)
  repo := repositories.PlaylistVideoRepo
  body, err := ioutil.ReadAll(r.Body)

  if err != nil {
	log.Println("Error reading request body")
	http.Error(w, "Error reading request body", http.StatusInternalServerError)
	return
  }

  var data TogglePlaylistVideoForm
  err = json.Unmarshal(body, &data)
  if err != nil {
		log.Println("Error parsing JSON data")
	http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
	return
  }

  _, err = repo.Create(data.PlaylistID, data.VideoID)

  if err != nil {
    log.Println("Error creating playlist video")
	http.Error(w, "Error creating playlist video", http.StatusInternalServerError)
	return
  }
}
