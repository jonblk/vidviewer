package db

import (
	"database/sql"
	"log"

	migrate "github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

var SQL *sql.DB
var err error

func CreateConnection(dbPath string) {
	SQL, err = sql.Open("sqlite3", dbPath)

	if err != nil {
		panic(err)
	}
}

func RunMigrations(dbPath string) {
	log.Println(dbPath)
	m, err := migrate.New("file://./migrations", "sqlite3:///"+dbPath)
	if err != nil {
		log.Println("Error creating migration")
		log.Fatal(err)
		panic(err)
	}

	for {
		err = m.Up()
		if err == migrate.ErrNoChange {
			break
		}
		if err != nil {
			log.Println("Error processing migrations: " + err.Error())
			break
		}
	}
}
