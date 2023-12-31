package models

import "database/sql"

type Video struct {
	ID               int64          `json:"id"`
	Url              string         `json:"url"`
	FileID           string         `json:"file_id"`
	FileFormat       string         `json:"file_format"`
	Title            string         `json:"title"`
	DownloadComplete bool           `json:"download_complete"`
	Duration         string         `json:"duration"`
	DownloadDate     string         `json:"download_date"`
	Md5Checksum      string         `json:"md5_checksum"`
	VideoFormat      sql.NullString `json:"video_format"`
}
