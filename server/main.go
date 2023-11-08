package main

import (
	"embed"
	"flag"
	"log"
	"net/http"
	"time"
	"vidviewer/config"
	"vidviewer/db"
	"vidviewer/repository"
	"vidviewer/routes"

	"github.com/gorilla/handlers"

	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
)

// Files/directories embeded into build
var (
	//go:embed build/*.html
	htmlFiles embed.FS

	//go:embed build
	assets embed.FS

	//go:embed migrations/*
	migrations embed.FS
)

func main() {
    // Get the app mode: dev/test/production(default)
    var mode string
	flag.StringVar(&mode, "mode", "production", "Mode of application runtime")
	flag.Parse()

	config.Initialize(mode == "test") 

	// Check if the migrations directory exists in the embedded file system
    _, err := migrations.ReadDir("migrations")

    if err == nil { 
		d, err := iofs.New(migrations, "migrations")
		if err != nil {
			log.Fatal(err)
		} 
		// Save the pointer to the embeded migrations driver 
		db.SetEmbededMigrations(d)
	}
	
	db.InitializeDB()

	repositories := repository.NewRepositories(&db.ActiveConnection)

	// Initialize routes
	r := routes.Initialize(assets, htmlFiles, repositories)

	var srv *http.Server

	if mode == "development" {
		// Enable CORS as we connect from host 5173
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
			IdleTimeout:  3 * time.Second,
			ReadTimeout:  3 * time.Second,
			WriteTimeout: 3 * time.Second,
		}
	}	

	log.Println("Starting server...")
	log.Fatal(srv.ListenAndServeTLS(config.GetSSLCertPath(), config.GetSSlKeyPath()))
}