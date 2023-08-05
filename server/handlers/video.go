package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"time"
	"vidviewer/config"
	"vidviewer/db"
	"vidviewer/files"
	"vidviewer/models"
	ws "vidviewer/websocket"
	"vidviewer/ytdlp"

	"github.com/gorilla/mux"

	_ "github.com/mattn/go-sqlite3"
)

type VideoUpdate struct {
	Title string `json:"title"`
}

// note these values have to correspond to client side code
const (
	VIDEO_DOWNLOAD_SUCCESS = "video_download_success"
	VIDEO_DOWNLOAD_FAIL = "video_download_fail"
)

func UpdateVideo(w http.ResponseWriter, r *http.Request) {
	// Retrieve the ID parameter from the request URL
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, err := strconv.Atoi(idParam)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Parse the JSON request body
	var videoUpdate VideoUpdate
	err = json.NewDecoder(r.Body).Decode(&videoUpdate)
	if err != nil {
		http.Error(w, "Failed to parse JSON body", http.StatusBadRequest)
		return
	}

	// Prepare the SQL update statement
	stmt, err := db.SQL.Prepare("UPDATE videos SET title = ? WHERE id = ?")
	if err != nil {
		http.Error(w, "Failed to prepare update statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	// Execute the update statement with the retrieved values
	_, err = stmt.Exec(videoUpdate.Title, id)
	if err != nil {
		http.Error(w, "Failed to update video", http.StatusInternalServerError)
		return
	}

	// Return a success message
	fmt.Fprintf(w, "Video updated successfully")
}

func DeleteVideo(w http.ResponseWriter, r *http.Request) {
	// Get the video ID from the request URL parameters
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, _ := strconv.Atoi(idParam)

	// get the file_id and file_format  
	// to use for deleting folders and files
	fileID, fileEXT, err := getFileIdAndExt(id)
    if err != nil {
		// Check if the error is due to video not found
		if err == sql.ErrNoRows {
			// Return a 404 Not Found response
			http.Error(w, "Video not found", http.StatusNotFound)
		} else {
			// Return a 500 Internal Server Error response
			http.Error(w, "Failed to delete Video", http.StatusInternalServerError)
		}
		return
	}

	// First delete playlist_videos 
	err = DeletePlaylistVideosFromDB(id)

    if err != nil {
		// Check if the error is due to video not found
		if err == sql.ErrNoRows {
			// Return a 404 Not Found response
			http.Error(w, "Video not found", http.StatusNotFound)
		} else {
			// Return a 500 Internal Server Error response
			http.Error(w, "Failed to delete Video", http.StatusInternalServerError)
		}
		return
	}

	// Delete the video from the database based on the ID
	err = deleteVideoFromDB(id)

	if err != nil {
		// Check if the error is due to video not found
		if err == sql.ErrNoRows {
			// Return a 404 Not Found response
			http.Error(w, "Video not found", http.StatusNotFound)
		} else {
			// Return a 500 Internal Server Error response
			http.Error(w, "Failed to delete Video", http.StatusInternalServerError)
		}
		return
	}

	// Delete the file and containing folders if they are empty
	files.DeleteFiles(config.Load().FolderPath, fileID, fileEXT, "jpg")

	// Return a 204 No Content response to indicate successful deletion
	w.WriteHeader(http.StatusNoContent)
}

func deleteVideoFromDB(id int) error {
	// Prepare the DELETE statement
	stmt, err := db.SQL.Prepare("DELETE FROM videos WHERE id = ?")

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

// Fetches a video and returns the file ID
func getFileIdAndExt(videoID int) (string, string, error) {
	var fileID string
	var fileEXT string

	// Prepare the SQL statement
	stmt, err := db.SQL.Prepare("SELECT file_id, file_format FROM videos WHERE id = ?")
	if err != nil {
		return "", "", fmt.Errorf("failed to prepare SQL statement: %w", err)
	}
	defer stmt.Close()

	// Execute the SQL statement
	err = stmt.QueryRow(videoID).Scan(&fileID, &fileEXT)
	if err != nil {
		return "", "", fmt.Errorf("failed to fetch video: %w", err)
	}

	return fileID, fileEXT, nil
}

func GetVideo(w http.ResponseWriter, r *http.Request) {
	// Get the video ID from the URL path
	vars := mux.Vars(r)
	videoIDStr := vars["id"]

	// Convert the video ID to an integer
	videoID, err := strconv.Atoi(videoIDStr)

	if err != nil {
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	rootFolderPath := config.Load().FolderPath

	video := models.Video{}

	err = db.SQL.QueryRow("SELECT * FROM videos WHERE id = ?", videoID).Scan(&video.ID, &video.Url, &video.FileID, &video.FileFormat, &video.YtID, &video.Title, &video.Duration, &video.DownloadComplete, &video.DownloadDate)

	if err != nil {
		log.Println(err.Error())
		http.Error(w, "Video not found", http.StatusNotFound)
		return
	}

	path := files.GetFilePath(rootFolderPath, video.FileID, video.FileFormat)

	// Open the video file
	videoFile, err := os.OpenFile(path, os.O_RDONLY, 0)

	if err != nil {
		http.Error(w, "Failed to open video file", http.StatusInternalServerError)
		return
	}
	defer videoFile.Close()

	// Set the Content-Type header based on the video file extension
	contentType := "video/mp4" // Change this based on the actual file type
	w.Header().Set("Content-Type", contentType)

	stat, err := videoFile.Stat()
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

	http.ServeContent(w, r, video.Title, stat.ModTime(), videoFile)
}

func CreateVideo(w http.ResponseWriter, r *http.Request) {
	rootFolderPath := config.Load().FolderPath
	tempFolderpath := files.GetTemporaryFolderPath(rootFolderPath)

	var err error

    // Check if the request method is POST
	if r.Method != http.MethodPost {
		log.Println("Method other than post sent")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the form data submitted by the user
	err = r.ParseForm()
	if err != nil {
		log.Println("Failed to parse form")
		log.Println(err)
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	// Extract the video url from the form value
	url := r.PostFormValue("url")
	if url == "" {
		log.Println("url is missing")
		http.Error(w, "Url is missing", http.StatusBadRequest)
		return
	}

	// Extract the PlaylistID from the form value
	playlistID := r.PostFormValue("playlistId")
	if playlistID == "" {
		log.Println("playlistID is missing")
		http.Error(w, "PlaylistID is missing", http.StatusBadRequest)
		return
	}

	// Get Video info
	duration, title, nil := ytdlp.ExtractVideoInfo(url)
	
	// Get yt vid id.  returns "" if not a youtube video
	ytID := extractVideoID(url)

	currentDate := time.Now().Format("2006-01-02")

	fileID, _ := generateFileID()

	downloadVideoPath := filepath.Join(tempFolderpath, fileID) 
	downloadImgPath   := filepath.Join(tempFolderpath, fileID)
	downloadVideoPathWithExt := filepath.Join(tempFolderpath, fileID+".mp4") 
	downloadImgPathWithExt   := filepath.Join(tempFolderpath, fileID+".jpg")

	// Create Video in db 
	createVideoStatement, err := db.SQL.Prepare(`
		INSERT INTO videos (download_date, url, title, yt_id, file_id, duration, download_complete, file_format) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`)

	// Check if error creating statement
	if err != nil {
		log.Println("error creating sql statement insert into videos")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer createVideoStatement.Close()

	result, err := createVideoStatement.Exec(currentDate, url, title, ytID, fileID, duration, false, "mp4")

	// Check if error processing sql statement
	if err != nil {
		log.Println("error processing sql")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	videoID, err := result.LastInsertId()

	if err != nil {
		log.Println("error getting last insert id")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create playlist video
	createPlaylistVideosStatement, err := db.SQL.Prepare(`
		INSERT INTO playlist_videos (playlist_id, video_id) 
		VALUES (?, ?)
	`)

	// Check if error creating statement
	if err != nil {
		log.Println("error creating playlist_videos statement")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer createPlaylistVideosStatement.Close()

	_, err = createPlaylistVideosStatement.Exec(playlistID, videoID)

	// Check if error processing sql statement
	if err != nil {
		log.Println("error processing playlist_videos statement")
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	onDownloadExit := func(isError bool) {
		if (isError) {
			log.Println("Error during download! Notifying client.")
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: VIDEO_DOWNLOAD_FAIL})
			return 
		}

		// Update video in db
		updateVideoOnDownloadSuccess()

        // Save thumbnails as JPG
		if ytID == "" {
			// if it's not a youtube video, extract image using ffmpeg
			extractThumbnail(downloadVideoPath, downloadImgPathWithExt)
		} else {
			// get image thumbnail from youtube
			ytdlp.DownloadVideoThumbnail(url, downloadImgPath)
		}

		// Create folders and move the file to it
		files.SaveVideoFileAndThumbnail(rootFolderPath, downloadVideoPathWithExt, downloadImgPathWithExt)

		log.Println("Video download related processing complete.  Notifying client of success:")
		// Write to websocket so client can refresh
		ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: VIDEO_DOWNLOAD_SUCCESS})
	}

	log.Println("begin video download...")

	// Download the video 
	go ytdlp.DownloadVideo(
		url, 
		downloadVideoPathWithExt, 
		onDownloadExit,
	) 
}	

func extractThumbnail(videoPath, outputPath string) error {
	// Run the FFmpeg command to extract the thumbnail
	cmd := exec.Command("ffmpeg", "-i", videoPath, "-ss", "00:00:01", "-vframes", "1", outputPath)
	err := cmd.Run()
	if err != nil {
		return err
	}

	return nil
}

func updateVideoOnDownloadSuccess() {
    // Prepare the SQL statement for inserting a row
	stmt, err := db.SQL.Prepare("INSERT INTO videos (download_complete, download_date) VALUES (?, ?)")

	if err != nil {
		log.Println(err)
	}

	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")

	// Execute the SQL statement with the values for the row
	_, _ = stmt.Exec(true, formattedTime)
}

func checkFileIDExists(fileID string) (bool, error) {
	// Prepare the SQL statement
	stmt, err := db.SQL.Prepare("SELECT COUNT(*) FROM videos WHERE file_id = ?")
	if err != nil {
		return false, err
	}
	defer stmt.Close()

	// Execute the SQL statement with the file ID parameter
	var count int
	err = stmt.QueryRow(fileID).Scan(&count)
	if err != nil {
		return false, err
	}

	// Check if the count is greater than 0
	exists := count > 0

	return exists, nil
}

func generateFileID() (string, error) {
	// Define the set of alphanumeric characters
	alphanumeric := "abcdef0123456789"

	for {
		// Generate a random string of length 8
		fileID := ""
		for i := 0; i < 12; i++ {
			// Generate a random index within the range of alphanumeric characters
			index, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphanumeric))))
			if err != nil {
				return "", err
			}

			// Append the randomly selected alphanumeric character to the file ID
			fileID += string(alphanumeric[index.Int64()])
		}

		// Check if the file ID exists in the table
		exists, err := checkFileIDExists(fileID)
		if err != nil {
			return "", err
		}

		// If the file ID does not exist, return it
		if !exists {
			return fileID, nil
		}
	}
}

func extractVideoID(url string) string  {
	// Define the regular expression pattern to match the YouTube video ID
	pattern := `(?i)(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})`

	// Compile the regular expression pattern
	regex, err := regexp.Compile(pattern)
	if err != nil {
		return "" 
	}

	// Find the first match of the video ID in the URL
	match := regex.FindStringSubmatch(url)
	if len(match) < 2 {
		return ""
	}

	// Return the extracted video ID
	return match[1]
}
