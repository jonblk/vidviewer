package routes

import (
	"bytes"
	"embed"
	"log"
	"net/http"
	"text/template"
	"time"
	"vidviewer/handlers"
	"vidviewer/middleware"
	"vidviewer/repository"

	"github.com/gorilla/mux"
	_ "modernc.org/sqlite"
)

var Router *mux.Router

func Initialize(assets embed.FS, htmlFiles embed.FS, repositories *repository.Repositories ) (r *mux.Router) {
	// Serve HTML files
	var serveHtml = func(w http.ResponseWriter, r *http.Request) {
		requestedPath := r.URL.Path
		if requestedPath == "/" {
			requestedPath = "/index.html" // Serve index.html for the root path
		}
		requestedPath = "build" + requestedPath

		templateContent, err := htmlFiles.ReadFile(requestedPath)
		if err != nil {
			log.Printf("Failed to read HTML file %s: %s", requestedPath, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		tpl, err := template.New("").Parse(string(templateContent))
		if err != nil {
			log.Printf("Failed to parse HTML file %s: %s", requestedPath, err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)

		if err := tpl.Execute(w, nil); err != nil {
			log.Printf("Failed to render HTML template: %s", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	// Serve js/css files
	var serveAssets = func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		ext := vars["ext"]

		requestedPath := r.URL.Path
		filePath := "build" + requestedPath
		assetContent, err := assets.ReadFile(filePath)

		if err != nil {
			log.Printf("Failed to read asset file %s: %s", requestedPath, err)
			log.Println(filePath)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		var contentType string

		if ext == "css" {
			contentType = "text/css"
		} else {
			contentType = "application/javascript"
		}

		// Set the "Content-Type" header based on the file extension
		w.Header().Set("Content-Type", contentType)

		// Serve the file content using http.FileServer
		http.ServeContent(w, r, filePath, time.Now(), bytes.NewReader(assetContent))
    }

    Router = mux.NewRouter()

	// Middleware 
	Router.Use(middleware.FfmpegYtdlpMiddleware)
	Router.Use(middleware.ConfigMiddleware)
	Router.Use(middleware.FilesMiddleware)
	Router.Use(middleware.DBMiddleware)
	Router.Use(middleware.WithRepositories(repositories))

	// Serve html files from build folder
	Router.HandleFunc("/", serveHtml).Methods("GET")

	// Serve assets from build folder 
	Router.HandleFunc("/assets/{file}.{ext}", serveAssets).Methods("GET")

    // Return thumbnail pictures
	Router.HandleFunc("/images/{file_id}", handlers.GetImage).Methods("GET")

	// Create a websocket connection 
	Router.HandleFunc("/websocket", handlers.HandleWebSocket)

	// Update config file
	Router.HandleFunc("/config", handlers.UpdateConfig).Methods("PUT")
	Router.HandleFunc("/config", handlers.GetConfig).Methods("GET")

	// PLAYLISTS
	Router.HandleFunc("/playlists", handlers.CreatePlaylist).Methods("POST")
	Router.HandleFunc("/playlists", handlers.GetAllPlaylists).Methods("GET")
	Router.HandleFunc("/playlists/{id}", handlers.UpdatePlaylist).Methods("PUT")
	Router.HandleFunc("/playlists/{id}", handlers.DeletePlaylist).Methods("DELETE")

	Router.HandleFunc("/video/{id}/playlists", handlers.GetVideoPlaylists).Methods("GET")

	// PLAYLISTVIDEOS
	Router.HandleFunc("/playlist_videos", handlers.DeletePlaylistVideo).Methods("DELETE")
	Router.HandleFunc("/playlist_videos", handlers.CreatePlaylistVideo).Methods("POST")
	

	// VIDEOS 
	Router.HandleFunc("/videos", handlers.CreateVideo).Methods("POST")
	Router.HandleFunc("/videos/{id}", handlers.GetVideo).Methods("GET")
	Router.HandleFunc("/videos/{id}", handlers.UpdateVideo).Methods("PUT")
	Router.HandleFunc("/videos/{id}", handlers.DeleteVideo).Methods("DELETE")
	Router.HandleFunc("/video_formats", handlers.GetVideoFormats).Methods("GET")

	Router.HandleFunc("/playlist/{id}/videos", handlers.GetVideosFromPlaylist).Methods("GET")

	return Router
}
