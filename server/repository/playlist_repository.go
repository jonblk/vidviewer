package repository

import (
	"database/sql"
	"log"
	"vidviewer/models"
)

type PlaylistRepository struct {
	db **sql.DB
}

func (repo *PlaylistRepository) GetDB() *sql.DB {
  return *repo.db
}

// The default playlist 
// Cannot be deleted, or modified by user
var allPlaylist = models.Playlist {ID: 0, Name: "All", Date: "" }

func (repo *PlaylistRepository) Update(id int64, name string) error {
    // Prepare the SQL update statement
	stmt, err := repo.GetDB().Prepare("UPDATE playlists SET name = ? WHERE id = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	// Execute the update statement with the retrieved values
	_, err = stmt.Exec(name, id)

	return err
}

func (repo *PlaylistRepository) GetAllFromVideo(videoID int64) ([]models.Playlist, error) {
  query := `
	SELECT p.*
	FROM playlists AS p
	JOIN playlist_videos AS pv ON p.id = pv.playlist_id
	WHERE pv.video_id = ?
	`

	// Query the database to get all columns from the playlist with the join
	rows, err := repo.GetDB().Query(query, videoID)

	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	defer rows.Close()

	playlists := []models.Playlist{}

	// Iterate over the rows and populate the videos slice
	for rows.Next() {
	    playlistItem := models.Playlist{}
		var p models.Playlist
		 err := rows.Scan(&p.ID, &p.Name, &p.Date)
		if err != nil {
			log.Fatal(err)
		}
		playlistItem.Name = p.Name
		playlistItem.ID = p.ID
		playlists = append(playlists, playlistItem)
	}

	// Check for any errors during iteration
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	return playlists, nil

}

func (repo *PlaylistRepository) Create(name string, date string) (error) {
	// Prepare the SQL statement for inserting a row
	stmt, err := repo.GetDB().Prepare("INSERT INTO playlists (name, date) VALUES (?, ?)")

	if err != nil {
		return err
	}

	// Execute the SQL statement with the values for the row
	_, err = stmt.Exec(name, date)

	return err
}

func (repo *PlaylistRepository) Delete(id int64) error {
    // Prepare the DELETE statement
	stmt, err := repo.GetDB().Prepare("DELETE FROM playlists WHERE id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	// Execute the DELETE statement with the ID parameter
	_, err = stmt.Exec(id)
	if err != nil {
		return err
	}

	return nil
} 

func (repo *PlaylistRepository) Index() ([]models.Playlist, error){
	rows, err := repo.GetDB().Query("SELECT * FROM playlists")
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	// Create a slice to store the playlists
	playlists := []models.Playlist{allPlaylist}

	// Iterate over the rows and scan each playlist into a struct
	for rows.Next() {
		var playlist models.Playlist
		err := rows.Scan(&playlist.ID, &playlist.Name, &playlist.Date)
		if err != nil {
			return nil, err
		}
		playlists = append(playlists, playlist)
	}

	return playlists, nil
}