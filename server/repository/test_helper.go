package repository

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

const migrationsPath = "./../migrations/"

// Helper function to create a new in-memory SQLite database and return a *sql.DB
func NewTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", "./../testdata/test.db?mode=rwc")
	if err != nil {
		t.Fatalf("Failed to open in-memory SQLite database: %s\n", err)
	}
	return db
}

func ApplyMigrations(t *testing.T, db *sql.DB) {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		t.Fatalf("Failed to create database driver: %s\n", err)
	}

	m, err := migrate.NewWithDatabaseInstance(fmt.Sprintf("file://%s", migrationsPath), "sqlite3", driver)
	if err != nil {
		t.Fatalf("Failed to create migrate instance: %s\n", err)
	}

	err = m.Up()
	if err != nil {
		t.Fatalf("Failed to apply migrations: %s\n", err)
	}
}

func CleanupMigrations(t *testing.T,  db *sql.DB) {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		t.Fatalf("Failed to create database driver: %s\n", err)
	}

	m, err := migrate.NewWithDatabaseInstance(fmt.Sprintf("file://%s", migrationsPath), "sqlite3", driver)
	if err != nil {
		t.Fatalf("Failed to create migrate instance: %s\n", err)
	}

	err = m.Down()
	if err != nil {
		t.Fatalf("Failed to cleanup migrations: %s\n", err)
	}

	// Close the database connection
	db.Close()
	
	// Delete the database file
	err = os.Remove("./../testdata/test.db")
	if err != nil {
		t.Fatalf("Failed to delete database file: %s\n", err)
	}
}