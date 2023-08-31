package main

import (
	"embed"
	"flag"
	"log"
	"net/http"
	"time"
	"vidviewer/config"
	"vidviewer/routes"

	"github.com/gorilla/handlers"

	_ "modernc.org/sqlite"
)

var (
	//go:embed build/*.html
	htmlFiles embed.FS

	//go:embed build
	assets embed.FS
)

var devBuildEnabled bool

func main() {
	// Initialize SSL Ceritification
	error := config.InitializeSSLCert()
	
	if (error != nil) {
		log.Fatal("Error initializing ssl certification:", error.Error())
	}

	log.Println("Config location is: " + config.Path())

	// Initialize routes
	r := routes.Initialize(assets, htmlFiles)

    // Parse command-line flags
	flag.BoolVar(&devBuildEnabled, "dev", false, "Enable dev build")
	flag.Parse()

	var srv *http.Server

	// Enable CORS only for 'dev' build tag: `go run . -dev`
	if devBuildEnabled {
		log.Println("Running server in dev mode.  Run the react dev server on port: 5173")

		// Enable CORS
		credentials := handlers.AllowCredentials()
		methods := handlers.AllowedMethods([]string{"GET", "POST", "DELETE", "PUT"})
		headers := handlers.AllowedHeaders([]string{"Content-Type", "Authorization"})
		origins := handlers.AllowedOrigins([]string{"http://localhost:5173"})
		corsHandler := handlers.CORS(credentials, methods, headers, origins)(r)

		srv = &http.Server{
			Addr:         ":8000",
			Handler:      corsHandler,
			IdleTimeout:  10 * time.Second,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		}
	} else {
		srv = &http.Server {
			Addr:         ":8000",
			Handler:      r,
			// NOTE what should these values be?
			IdleTimeout:  10 * time.Second,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		}
	}	

	log.Fatal(srv.ListenAndServeTLS(config.GetSSLCertPath(), config.GetSSlKeyPath()))
}