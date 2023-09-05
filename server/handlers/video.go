package handlers

import (
	"crypto/md5"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
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
	"vidviewer/files"
	"vidviewer/middleware"
	"vidviewer/models"
	"vidviewer/repository"
	ws "vidviewer/websocket"
	"vidviewer/ytdlp"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

type VideoUpdate struct {
	Title string `json:"title"`
	Playlists []VideoPlaylist `json:"videoPlaylists"`
}

func computeChecksum(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

const ALL_PLAYLIST_ID = 0;

func GetVideosFromPlaylist(w http.ResponseWriter, r *http.Request) {
	repo := getVideoRepository(r)

	vars := mux.Vars(r)
	playlistIDStr := vars["id"]

	queryParams := r.URL.Query()

	pageStr := queryParams.Get("page")
	if pageStr == "" {
		pageStr = "1"
	}
	limitStr := queryParams.Get("limit")
	if limitStr == "" {
		limitStr = "10"
	}

	page, _ := strconv.ParseUint(pageStr, 10, 0)
	limit, _ := strconv.ParseUint(limitStr, 10, 0)

	// Convert the playlist ID to an integer
	playlistID, err := strconv.ParseInt(playlistIDStr,10,64)

	if err != nil {
		log.Println("Invalid playlist ID")
		http.Error(w, "Invalid playlist ID", http.StatusBadRequest)
		return
	}

	videos, err := repo.GetFromPlaylist(playlistID, uint(limit), uint(page))

	if (err != nil) {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	jsonData, err := json.Marshal(videos)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	// Set the response headers and write the JSON data to the response
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func UpdateVideo(w http.ResponseWriter, r *http.Request) {
	videoRepo := getVideoRepository(r)
	playlistVideoRepo := getPlaylistVideoRepository(r)

	// Retrieve the ID parameter from the request URL
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, err := strconv.ParseInt(idParam, 10, 64)
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

	// Get video from db
	video, err := videoRepo.Get(id) 

	if (err != nil) {
		http.Error(w, "Unable to get video", http.StatusBadRequest)
	}

	video.Title = videoUpdate.Title

	// Update the playlistVideo table
	UpdateVideoPlaylists(playlistVideoRepo, id, videoUpdate.Playlists)

	err = videoRepo.Update(video)

	if err != nil {
		http.Error(w, "Failed to update video", http.StatusInternalServerError)
		return
	}

	// Return Success message
	fmt.Fprintf(w, "Video updated successfully")
}

func DeleteVideo(w http.ResponseWriter, r *http.Request) {
	videoRepo := getVideoRepository(r)
	playlistVideoRepo := getPlaylistVideoRepository(r)

	// Get config from context
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath 

	// Get the video ID from the request URL parameters
	vars := mux.Vars(r)
	idParam := vars["id"]
	id, _ := strconv.ParseInt(idParam, 10, 64)

	// get the file_id and file_format  
	// to use for deleting folders and files
	video, err := videoRepo.Get(id)
	fileID  := video.FileID
	fileEXT := video.FileFormat

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

	// Delete playlist_videos that have the video id 
	err = playlistVideoRepo.Delete(-1, id)

    if err != nil {
		// Return a 500 Internal Server Error response
		http.Error(w, "Failed to delete playlist videos", http.StatusInternalServerError)
		return
	}

	// Delete the video from the database based on the ID
	err = videoRepo.Delete(id)

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
	files.DeleteFiles(rootFolderPath, fileID, fileEXT, "jpg")

	// Return a 204 No Content response to indicate successful deletion
	w.WriteHeader(http.StatusNoContent)
}

func GetVideo(w http.ResponseWriter, r *http.Request) {
	// read from context
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath  // Type assert to your config type
	videoRepo := getVideoRepository(r)

	// Get the video ID from the URL path
	vars := mux.Vars(r)
	videoIDStr := vars["id"]

	// Convert the video ID to an integer
	videoID, err := strconv.ParseInt(videoIDStr, 10, 64)

	if err != nil {
		http.Error(w, "Invalid video ID", http.StatusBadRequest)
		return
	}

	video, err := videoRepo.Get(videoID)

	if err != nil {
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

func GetVideoFormats(w http.ResponseWriter, r *http.Request) {
	// Get the value of the "url" parameter from the URL query string
	urlParam := r.URL.Query().Get("url")

    // TEMPORARY
	formats, err := ytdlp.GetFormats(urlParam)

	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonFormats, err := json.Marshal(formats)

	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonFormats)
}

func getVideoRepository(r *http.Request) repository.VideoRepository{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).VideoRepo
}

func getPlaylistVideoRepository(r *http.Request) repository.PlaylistVideoRepository{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).PlaylistVideoRepo
}

// Downloads video from yt-dlp
func CreateVideo(w http.ResponseWriter, r *http.Request) {
	// Context
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath
	videoRepository := getVideoRepository(r)
	playlistVideoRepository := getPlaylistVideoRepository(r)
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

	format := r.PostFormValue("video_format") 

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

	//downloadVideoPath := filepath.Join(tempFolderpath, fileID) 
	downloadImgPath   := filepath.Join(tempFolderpath, fileID)
	downloadVideoPathWithExt := filepath.Join(tempFolderpath, fileID+".mp4") 
	downloadImgPathWithExt   := filepath.Join(tempFolderpath, fileID+".jpg")

	video := models.Video {
		DownloadDate: currentDate, 
		FileID: fileID, 
		Url: url,
		Title: title,
		YtID: ytID,
		Duration: duration,
		DownloadComplete: false,
		FileFormat: "mp4",
	}

	videoID, err := videoRepository.Create(video)

	video.ID = videoID;

	if err != nil {
		log.Println("Error inserting video into videos table", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
    
	playlistId, err := strconv.ParseInt(playlistID, 10, 64)

	if err != nil {
		log.Println("Bad playlist id, error parsing to integer", playlistID)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	
	id, err := playlistVideoRepository.Create(playlistId, videoID)

	if err != nil {
		log.Println("Error inserting into playlistVideo table", id)
	}

	// Check if error processing sql statement
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	onDownloadExit := func(isError bool) {
		if (isError) {
			log.Println("Error during download! Notifying client.")
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadFail)})
			return 
		}

		// Update video in db
		updateVideoOnDownloadSuccess(videoRepository, video, downloadVideoPathWithExt)

		log.Println("youtube id is :" + ytID)
       
		// Save thumbnail
		err = ytdlp.DownloadVideoThumbnail(url, downloadImgPath)

		// If save unsuccessful, use FFMPEG
		if err != nil {
			extractThumbnail(downloadVideoPathWithExt, downloadImgPathWithExt)
		}

		// Create folders and move the file to it
		thumbnailPath, err := files.SaveVideoFileAndThumbnail(rootFolderPath, downloadVideoPathWithExt, downloadImgPathWithExt)

		if err != nil {
			log.Println(err.Error())
		} else {
			log.Println("thumbnail location: " + thumbnailPath)
		}

		log.Println("Video download related processing complete.  Notifying client of success:")

		// Write to websocket so client can refresh
		ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadSuccess)})
	}

	log.Println("begin video download...")

	// Download the video 
	go ytdlp.DownloadVideo(
		url, 
		format,
		downloadVideoPathWithExt, 
		onDownloadExit,
	) 
}	

func extractThumbnail(videoPath, outputPath string) error {
	log.Println("Extracting thumbnail with ffmpeg...")
	// Run the FFmpeg command to extract the thumbnail
	cmd := exec.Command("ffmpeg", "-i", videoPath, "-ss", "00:00:01", "-vframes", "1", outputPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println("FFMPEG Error:", err)
		fmt.Println("Output:", string(output))
		return err
	}

	return nil
}

func updateVideoOnDownloadSuccess(repo repository.VideoRepository, video models.Video, filepath string) {
	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")
	md5Checksum, checksumErr := computeChecksum(filepath)

	if (checksumErr != nil) {
		log.Println("Error generating video file checksum") 
	}

	video.DownloadComplete = true
	video.DownloadDate = formattedTime
	video.Md5Checksum = sql.NullString{String: md5Checksum, Valid: true}

    // Prepare the SQL statement for inserting a row
	repo.Update(video)
}

func generateFileID() (string, error) {
	// Define the set of alphanumeric characters
	alphanumeric := "abcdef0123456789"

		// Generate a random string of length 12 
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

	    return fileID, nil
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
