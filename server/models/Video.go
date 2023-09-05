package models

import (
	"database/sql"
)

type Video struct {
	YtID             string `json:"yt_id" sql:"yt_id"`
	ID               int64    `json:"id"`
	Url              string `json:"url"`
	FileID           string `json:"file_id"`
	FileFormat       string `json:"file_format"`
	Title            string `json:"title"`
	DownloadComplete bool   `json:"download_complete"`
	Duration         string `json:"duration"`
	DownloadDate     string `json:"download_date"`
	Md5Checksum      sql.NullString `json:"md5_checksum"`
}
