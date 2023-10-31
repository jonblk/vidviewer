package repository

import (
	"database/sql"
	"strconv"
	"testing"
	"vidviewer/models"

	_ "github.com/mattn/go-sqlite3"
)

// Helper function to create a new VideoRepository
func newTestRepo(t *testing.T, db *sql.DB) *VideoRepository {
	return &VideoRepository{db: &db}
}

// Helper function to insert a video into the database
func insertVideo(t *testing.T, repo *VideoRepository, video models.Video) int64{
	id, err := repo.Create(video)
	if err != nil {
		t.Fatalf("Failed to insert video: %s\n", err)
		return -1
	} else {
		return id;
	}
}

func newVideo() models.Video{
    return models.Video{
		DownloadDate:      "test_date",
		Url:               "test_url",
		Title:             "test_title",
		YtID:              "test_ytid",
		FileID:            "test_fileid",
		Duration:          "test_duration",
		DownloadComplete:  true,
		FileFormat:        "test_format",
		Md5Checksum:       "test_checksum",
	}
}

func TestCreate(t *testing.T) {
	// Create a new in-memory SQLite database
	db := NewTestDB(t)

	// Run migrations
	ApplyMigrations(t, db)

	// Create a VideoRepository with the in-memory database
	repo := newTestRepo(t, db)

	// Create a video
	video := newVideo()

	// Call the Create method and check the returned ID and error
	id := insertVideo(t, repo, video) 

	if id != 1 {
		t.Errorf("Expected ID to be 1, got %d", id)
	}

	CleanupMigrations(t, db)
}

func TestGetBy(t *testing.T) {
	// Create a new in-memory SQLite database
	db := NewTestDB(t)

	// Run migrations
	ApplyMigrations(t, db)

	// Create a VideoRepository with the in-memory database
	repo := newTestRepo(t, db)

	// Insert a video into the database and get the returned ID
	video := newVideo()

	id := insertVideo(t, repo, video)

	// Call the GetBy method with the ID and check the returned video and error
	video, err := repo.GetBy(strconv.FormatInt(id, 10), "id")


	if err != nil {
		t.Errorf("Expected nil error, got %s", err)
	}

	if video.Title != "test_title" {
		t.Errorf("Expected title to be 'test_title', got '%s'", video.Title)
	}

	CleanupMigrations(t, db);
}
