package db

import (
	"database/sql"
	"log"
	"time"

	migrate "github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

// Access the database using the db.SQL variable,
// which is an instance of *sql.DB representing the connection pool

var dbs map[string]*sql.DB

var ActiveConnection *sql.DB

func GetDB(path string) (*sql.DB, bool) {
  _, exists := dbs[path] 
	return dbs[path], exists 
}

func GetActiveConnection() *sql.DB {
  return ActiveConnection;
}

func UpdateActiveConnection(dbPath string) *sql.DB {
  var err error

	if _, exists := dbs[dbPath]; !exists {
		dbs[dbPath], err = sql.Open("sqlite3", dbPath)

		if err != nil {
			log.Println("Error creating SQLITE connection pool")
			panic(err)
		}

		// Set connection pool size
		dbs[dbPath].SetMaxOpenConns(10)
		dbs[dbPath].SetMaxIdleConns(5)
		dbs[dbPath].SetConnMaxIdleTime(5 * time.Minute)

		runMigrations(dbPath)
	}

  // Update active connection
  ActiveConnection = dbs[dbPath]

  return ActiveConnection
}

func InitializeDB() {
  if dbs == nil {
    dbs = make(map[string]*sql.DB)
  }
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
