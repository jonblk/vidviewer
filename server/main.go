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

//go:embed build/*.html
var htmlFiles embed.FS

//go:embed build
var assets embed.FS

//go:embed migrations/*
var migrations embed.FS

// Passed with ldflags = go build -ldflags "-X main.myVar=myValue" 
var serverPort string
var clientPort string

func main() {
    var mode string
	flag.StringVar(&mode, "mode", "production", "Mode of application runtime")
	flag.Parse()

	isTestMode := mode == "test"

	config.Initialize(isTestMode) 

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


	if mode == "dev" {
		credentials := handlers.AllowCredentials()
		methods := handlers.AllowedMethods([]string{"GET", "POST", "DELETE", "PUT"})
		headers := handlers.AllowedHeaders([]string{"Content-Type", "Authorization"})
		origins := handlers.AllowedOrigins([]string{"http://localhost:" + clientPort})
		corsHandler := handlers.CORS(credentials, methods, headers, origins)(r)

		srv = &http.Server{
			Addr:         ":" + serverPort,
			Handler:      corsHandler,
			IdleTimeout:  4 * time.Second,
			ReadTimeout:  4 * time.Second,
			WriteTimeout: 4 * time.Second,
		}
	} else {
		srv = &http.Server {
			Addr:         ":" + serverPort,
			Handler:      r,
			IdleTimeout:  4 * time.Second,
			ReadTimeout:  4 * time.Second,
			WriteTimeout: 4 * time.Second,
		}
	}	

    if mode == "test" {
		log.Println("Running server in Test Mode")
	}

	log.Fatal(
		srv.ListenAndServeTLS(
			config.GetSSLCertPath(), 
			config.GetSSlKeyPath(),
		),
	)
}
