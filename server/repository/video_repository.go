package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"vidviewer/models"

	_ "github.com/mattn/go-sqlite3"
)

type VideoRepository struct {
    db **sql.DB
}

func (repo *VideoRepository) GetDB() *sql.DB {
  return *repo.db
}

func (repo *VideoRepository) SetDB(sql *sql.DB) {
	repo.db = &sql
}

const ALL_PLAYLIST_ID string = "0"

// Get the video
func (repo *VideoRepository) GetBy(value string, by string) (*models.Video, error) {
	video := models.Video{}
    query := fmt.Sprintf("SELECT * FROM videos WHERE %s = ?", by)

	err := repo.GetDB().QueryRow(query, value).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		} else {
			return nil, err
		}
	}

	return &video, nil
}

// Get the video
func (repo *VideoRepository) Get(id string) (*models.Video, error) {
	// Check if the video exists
	var count int
	err := repo.GetDB().QueryRow("SELECT COUNT(*) FROM videos WHERE id = ?", id).Scan(&count)
	if err != nil {
		return nil, err
	}

	// If the video does not exist, return an error
	if count == 0 {
		return nil, errors.New("video not found")
	}

	// If the video exists, retrieve it
	video := &models.Video{}
	err = repo.GetDB().QueryRow("SELECT * FROM videos WHERE id = ?", id).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)
	if err != nil {
		return nil, err
	}

	return video, nil
}

// Update the video
func (repo *VideoRepository) Update(video models.Video) error {
	stmt, err := repo.GetDB().Prepare(`
	  UPDATE videos 
	  SET url = ?,
	  file_id = ?,
	  file_format = ?,
	  title = ?,
	  download_complete = ?,
	  duration = ?,
	  download_date = ?,
	  md5_checksum = ?
	  WHERE id = ?
	`)

	if err != nil {
		return err
	}

	defer stmt.Close()

	_, err = stmt.Exec(
		video.Url,
		video.FileID,
		video.FileFormat,
		video.Title,
		video.DownloadComplete,
		video.Duration,
		video.DownloadDate,
		video.Md5Checksum,
		video.ID,
	)

	if err != nil {
		return err
	} else {
		return nil
	}
}

// Insert video it into videos table
func (repo *VideoRepository) Create(video models.Video) (int64, error) {
	createVideoStatement, err := repo.GetDB().Prepare(`
		INSERT INTO videos (download_date, url, title,   file_id, duration, download_complete, file_format, md5_checksum) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return -1, err
	}

	defer createVideoStatement.Close()

	result, err := createVideoStatement.Exec(video.DownloadDate, video.Url, video.Title, video.FileID, video.Duration, video.DownloadComplete, video.FileFormat, video.Md5Checksum)

	// Check if error processing sql statement
	if err != nil {
		return -1, err
	}

	videoID, err := result.LastInsertId()

	if err != nil {
		return -1, err
	}

	return videoID, nil
}

// Delete video from videos table
func (repo *VideoRepository) Delete(id string) error {
	stmt, err := repo.GetDB().Prepare("DELETE FROM videos WHERE id = ?")

	if err != nil {
		return err
	}

	defer stmt.Close()

	_, err = stmt.Exec(id)

	if err != nil {
		return err
	} else {
		return nil
	}
}

// Returns all videos belonging to playlist
func (repo *VideoRepository) GetFromPlaylist(playlistID string, limit uint, page uint, like string, sortBy uint) ([]models.Video, error) {
    var query string
	var rows *sql.Rows
	var err error

	var likeQuery string

	if like == "" {
		likeQuery = ""
	} else {
        likeQuery = fmt.Sprintf(" AND title LIKE '%%%s%%'", like)
	}

	var sort = "ASC"

	if sortBy == 0 {
		sort = "DESC"
	} 

	if (ALL_PLAYLIST_ID != playlistID) {
		query = `
		SELECT v.*
		FROM videos AS v
		JOIN playlist_videos AS pv ON v.id = pv.video_id
		WHERE pv.playlist_id = ? AND download_complete = 1` + likeQuery + `	
		ORDER BY v.download_date ` + sort + `, v.id ` + sort + `
        LIMIT ? 
		OFFSET ?
	    `
	    rows, err = repo.GetDB().Query(query, playlistID, limit, (page-1)*limit)
	} else {
		query = `
		SELECT * FROM videos 
		WHERE download_complete = 1` + likeQuery + ` 
		ORDER BY download_date ` + sort + `, id ` + sort + `
        LIMIT ? 
		OFFSET ?
		`
	    rows, err = repo.GetDB().Query(query, limit, (page-1)*limit)
	}

	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	defer rows.Close()

	videos := []models.Video{}

	for rows.Next() {
	    videoItem := models.Video{}
		var video models.Video
		 err := rows.Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat,  &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)
		if err != nil {
			log.Fatal(err)
			return nil, err
		}
		videoItem.DownloadDate = video.DownloadDate
		videoItem.DownloadComplete = video.DownloadComplete
		videoItem.ID = video.ID
		videoItem.Title = video.Title
		videoItem.Duration = video.Duration
		videoItem.FileID = video.FileID
		videoItem.Url = video.Url
		videos = append(videos, videoItem)
	}

	return videos, nil
}