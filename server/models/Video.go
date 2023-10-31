package models

type Video struct {
	ID               int64  `json:"id"`
	Url              string `json:"url"`
	FileID           string `json:"file_id"`
	FileFormat       string `json:"file_format"`
	YtID             string `json:"yt_id" sql:"yt_id"`
	Title            string `json:"title"`
	DownloadComplete bool   `json:"download_complete"`
	Duration         string `json:"duration"`
	DownloadDate     string `json:"download_date"`
	Md5Checksum      string `json:"md5_checksum"`
}
