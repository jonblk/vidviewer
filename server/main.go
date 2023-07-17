package main

import (
	"database/sql"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v2"

	"github.com/gorilla/mux"
	_ "modernc.org/sqlite"
)

var db *sql.DB
var settings *Settings

type App struct {
	Router *mux.Router
}

func createPlaylist(w http.ResponseWriter, r *http.Request) {
	// Prepare the SQL statement for inserting a row
	stmt, err := db.Prepare("INSERT INTO playlists (name, date) VALUES (?, ?)")

	if err != nil {
		log.Println(err)
	}

	err = r.ParseForm()
	if err != nil {
		// Handle error
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	// Retrieve the value of the "name" property from the form data
	name := r.Form.Get("name")

	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")

	// Execute the SQL statement with the values for the row
	_, err = stmt.Exec(name, formattedTime)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Println("Playlist row inserted successfully")
}

func deletePlaylist(w http.ResponseWriter, r *http.Request) {
	// Get the playlist ID from the request URL parameters
	vars := mux.Vars(r)
	id := vars["id"]

	// Delete the playlist from the database based on the ID
	err := deletePlaylistFromDB(id)

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
	stmt, err := db.Prepare("DELETE FROM playlists WHERE id = ?")

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

func initializeRoutes(router *mux.Router) {
	router.HandleFunc("/playlists", createPlaylist).Methods("POST")
	router.HandleFunc("/playlists/{id}", deletePlaylist).Methods("DELETE")

	/*
		a.Router.HandleFunc("/videos", a.getAllVideos).Methods("GET")
		a.Router.HandleFunc("/videos/{id}", a.getVideoByID).Methods("GET")
		a.Router.HandleFunc("/videos", a.createVideo).Methods("POST")
		a.Router.HandleFunc("/videos/{id}", a.updateVideo).Methods("PUT")
		a.Router.HandleFunc("/videos/{id}", a.deleteVideo).Methods("DELETE")
	*/
}

func getRootPath() string {
	path, _ := os.UserConfigDir()
	return filepath.Join(path, "VidViewer")
}

type Settings struct {
	FolderPath string `yaml:"folderPath"`
}

func loadSettings(rootPath string) (*Settings, error) {
	filePath := filepath.Join(rootPath, "settings.yaml")

	// Check if the settings file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Println("Welcome to VidViewer! Please type the root folder path. This is where the video files will be saved.")

		// Prompt the user to input the folder path
		var folderPath string
		fmt.Print("Folder Path: ")
		fmt.Scanln(&folderPath)

		// Check if the specified folder path exists
		if _, err := os.Stat(folderPath); os.IsNotExist(err) {
			log.Println("The specified folder path does not exist. Please try again.")
			return loadSettings(filePath) // Recursively ask for input again
		}

		// Save the folder path to the settings file
		s := &Settings{
			FolderPath: folderPath,
		}

		data, err := yaml.Marshal(&s)

		if err != nil {
			return nil, err
		}

		err = ioutil.WriteFile(filePath, data, 0644)

		if err != nil {
			return nil, err
		}

		return s, nil
	}

	// Load the settings from the settings file
	data, err := ioutil.ReadFile(filePath)

	if err != nil {
		return nil, err
	}

	settings := &Settings{}

	err = yaml.Unmarshal(data, &settings)

	if err != nil {
		return nil, err
	}

	return settings, nil
}

func main() {
	path := getRootPath()

	var err error

	// Create path in AppData
	if _, err = os.Stat(path); errors.Is(err, os.ErrNotExist) {
		err := os.Mkdir(path, os.ModePerm)
		if err != nil {
			log.Println(err)
		}
	}

	settings, err = loadSettings(path)

	if err != nil {
		panic(err)
	}

	db, err = sql.Open("sqlite", filepath.Join(path, "sqlite.db"))

	if err != nil {
		panic(err)
	}

	var r = mux.NewRouter()

	initializeRoutes(r)

	// Create the playlists table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS playlists (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE,
			date TEXT
		)
	`)

	if err != nil {
		panic(err)
	}

	fmt.Println(path)

	log.Fatal(http.ListenAndServe(":8000", r))
}
