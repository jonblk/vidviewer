package models

type Playlist struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Date string `json:"date"`
}