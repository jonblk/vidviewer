package db

import (
	"database/sql"
	"log"
	"time"

	migrate "github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source"
	_ "github.com/golang-migrate/migrate/v4/source/iofs"

	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// Access the database using the db.SQL variable,
// which is an instance of *sql.DB representing the connection pool
var dbs map[string]*sql.DB

var ActiveConnection *sql.DB

var embededMigrations *source.Driver

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

		if embededMigrations == nil {
			runMigrations(dbPath)
		} else {
			runMigrationsFromEmbedded(dbPath, *embededMigrations)
		}
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

func SetEmbededMigrations(migrations source.Driver) {
	embededMigrations = &migrations 
}

// Run the migrations from the migrations folder 
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

// Run the migrations from the migrations folder 
// that is embeded in the binary build
func runMigrationsFromEmbedded(dbPath string, d source.Driver) {
	log.Println("running embeded migrations")
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        log.Fatal(err)
    }

    driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
    if err != nil {
        log.Fatal(err)
    }

    m, err := migrate.NewWithInstance("iofs", d, "sqlite3", driver)
    if err != nil {
        log.Fatal(err)
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

	if err != migrate.ErrNoChange {
		log.Fatal("Migration failed with error: " + err.Error())
	}
}