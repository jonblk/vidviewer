package repository

import (
	"database/sql"
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

const ALL_PLAYLIST_ID string = "0"

// Get the video
func (repo *VideoRepository) GetBy(value string, by string) (models.Video, error) {
	video := models.Video{}
    query := fmt.Sprintf("SELECT * FROM videos WHERE %s = ?", by)

	log.Println(query)
	log.Println(value)

	err := repo.GetDB().QueryRow(query, value).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)

	if err != nil {
		log.Println(err.Error())
		return video, err
	}

	return video, nil
}

// Get the video
func (repo *VideoRepository) Get(id string) (models.Video, error) {
	video := models.Video{}

	err := repo.GetDB().QueryRow("SELECT * FROM videos WHERE id = ?", id).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)

	if err != nil {
		log.Println(err.Error())
		return video, err
	}

	return video, nil
}

// Update the video
func (repo *VideoRepository) Update(video models.Video) error {
	stmt, err := repo.GetDB().Prepare(`
	  UPDATE videos 
	  SET yt_id = ?, 
	  url = ?,
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
		video.YtID,  
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
		INSERT INTO videos (download_date, url, title, yt_id, file_id, duration, download_complete, file_format) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return -1, err
	}

	defer createVideoStatement.Close()

	result, err := createVideoStatement.Exec(video.DownloadDate, video.Url, video.Title, video.YtID, video.FileID, video.Duration, video.DownloadComplete, video.FileFormat)

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

// Returns all videos according to: playlist, limit, and page number
func (repo *VideoRepository) GetFromPlaylist(playlistID string, limit uint, page uint) ([]models.Video, error) {
    var query string
	var rows *sql.Rows
	var err error

	if (ALL_PLAYLIST_ID != playlistID) {
		query = `
		SELECT v.*
		FROM videos AS v
		JOIN playlist_videos AS pv ON v.id = pv.video_id
		WHERE pv.playlist_id = ? AND download_complete = 1 
		ORDER BY id ASC
        LIMIT ? 
		OFFSET ?
	    `
	   rows, err = repo.GetDB().Query(query, playlistID, limit, (page-1)*limit)
	} else {
		query = `
		SELECT * FROM videos 
		WHERE download_complete = 1 
		ORDER BY id ASC
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
		 err := rows.Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate, &video.Md5Checksum)
		if err != nil {
			log.Fatal(err)
			return nil, err
		}
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