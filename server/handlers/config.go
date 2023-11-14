package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"vidviewer/config"
	customErrors "vidviewer/errors"
	"vidviewer/middleware"

	_ "github.com/mattn/go-sqlite3"
)

type UpdateConfigFormData struct {
	RootFolderPath string `json:"root_folder_path"`
}

func GetConfig(w http.ResponseWriter, r *http.Request) {
    c := r.Context().Value(middleware.ConfigKey).(config.Config)

	json, err := json.Marshal(c)

	if (err != nil) {
		http.Error(w, "error parsing json", http.StatusInternalServerError)
	}

	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(json)
}

func UpdateConfig(w http.ResponseWriter, r *http.Request) {
	c := r.Context().Value(middleware.ConfigKey).(config.Config)

	var formData UpdateConfigFormData
	err := json.NewDecoder(r.Body).Decode(&formData)

	if err != nil {
		// Handle the error
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Println(formData.RootFolderPath)

	rootFolderPath := formData.RootFolderPath

    if _, err = os.Stat(rootFolderPath); errors.Is(err, os.ErrNotExist) {
		error := customErrors.RootFolderNotFoundError()
		http.Error(w, error.Error(), error.StatusCode)
		return
	}

	c.FolderPath = rootFolderPath

	config.Update(c)

	log.Println("Config Update Succesful, current root folder path is: " + c.FolderPath)
}