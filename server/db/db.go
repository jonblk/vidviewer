package db

import (
	"database/sql"
	"log"
	"sync"
	"time"

	migrate "github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

// Access the database using the db.SQL variable,
// which is an instance of *sql.DB representing the connection pool
var SQL *sql.DB
var once sync.Once

func initialize(dbPath string) {
    var err error
	SQL, err = sql.Open("sqlite3", dbPath)

	if err != nil {
		log.Println("Error creating SQLITE connection pool")
		panic(err)
	}

		// Set connection pool size
	SQL.SetMaxOpenConns(10)
	SQL.SetMaxIdleConns(5)
	SQL.SetConnMaxIdleTime(5 * time.Minute)

	runMigrations(dbPath)
}

func Initialize(dbPath string) *sql.DB{
	once.Do(func() {initialize(dbPath)})
	return SQL
}

func runMigrations(dbPath string) {
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
