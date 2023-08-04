package models

type Video struct {
	YtID             string `json:"yt_id"`
	ID               int    `json:"id"`
	Url              string `json:"url"`
	FileID           string `json:"file_id"`
	FileFormat       string `json:"file_format"`
	Title            string `json:"title"`
	DownloadComplete bool   `json:"download_complete"`
	Duration         string `json:"duration"`
	DownloadDate     string `json:"download_date"`
}
