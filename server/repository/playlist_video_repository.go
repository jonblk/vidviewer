package repository

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type PlaylistVideoRepository struct {
    db **sql.DB
}

func (repo *PlaylistVideoRepository) GetDB() *sql.DB {
  return *repo.db
}

func (repo *PlaylistVideoRepository) SetDB(sql *sql.DB) {
	repo.db = &sql
}

func (repo *PlaylistVideoRepository) Get(playlist_id string, video_id string) (int64, error) {
  // Check if the row exists before trying to delete it
	row := repo.GetDB().QueryRow("SELECT id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?", playlist_id, video_id)
	var id int64
	err := row.Scan(&id)
	return id, err
}

func (repo *PlaylistVideoRepository) Create(playlist_id string, video_id string) (int64, error) {
	query := "INSERT INTO playlist_videos (playlist_id, video_id) VALUES (?, ?)"

	result, err := repo.GetDB().Exec(query, playlist_id, video_id)

	if err != nil {
		log.Println("Error generating sql query")
		return -1, err
	}

	id, err := result.LastInsertId()

	if err != nil {
		log.Println("Error inserting into playlistVideo table", id)
		return -1, err
	}

	return id, nil
}

func (repo *PlaylistVideoRepository) Delete(playlist_id string, video_id string) error{
	stmt, _ := repo.GetDB().Prepare("DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ? ")
	defer stmt.Close()
	_, err := stmt.Exec(playlist_id, video_id)
	return err
}

func (repo *PlaylistVideoRepository) OnDeletePlaylist(playlist_id string) error {
	var stmt *sql.Stmt
	var err error

    stmt, err = repo.GetDB().Prepare("DELETE FROM playlist_videos WHERE playlist_id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	_, err = stmt.Exec(playlist_id)

	if err != nil {
		return err
	}

	return nil
}

func (repo *PlaylistVideoRepository) OnDeleteVideo(video_id string) error {
	var stmt *sql.Stmt
	var err error

    stmt, err = repo.GetDB().Prepare("DELETE FROM playlist_videos WHERE video_id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	_, err = stmt.Exec(video_id)

	if err != nil {
		return err
	}

	return nil
}