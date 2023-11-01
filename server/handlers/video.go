package handlers

import (
	"crypto/md5"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
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
	playlistID := vars["id"]

	queryParams := r.URL.Query()

	pageStr := queryParams.Get("page")
	if pageStr == "" {
		pageStr = "1"
	}
	limitStr := queryParams.Get("limit")
	if limitStr == "" {
		limitStr = "10"
	}

	like := queryParams.Get("search") 

	sortBy, _ := strconv.ParseUint(queryParams.Get("sortBy"), 10, 0)

	page, _ := strconv.ParseUint(pageStr, 10, 0)
	limit, _ := strconv.ParseUint(limitStr, 10, 0)

	videos, err := repo.GetFromPlaylist(playlistID, uint(limit), uint(page), like, uint(sortBy))

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

	// Retrieve the ID parameter from the request URL
	vars := mux.Vars(r)
	id := vars["id"]

	// Parse the JSON request body
	var videoUpdate VideoUpdate
	err := json.NewDecoder(r.Body).Decode(&videoUpdate)
	if err != nil {
		log.Println("Failed to parse JSON BODY")
		http.Error(w, "Failed to parse JSON body", http.StatusBadRequest)
		return
	}

	// Get video from db
	video, err := videoRepo.Get(id) 

	if (err != nil) {
		log.Println("Failed to get video from db")
		http.Error(w, "Unable to get video", http.StatusBadRequest)
	}

	video.Title = videoUpdate.Title

	err = videoRepo.Update(*video)

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
	id := vars["id"]

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
	err = playlistVideoRepo.OnDeleteVideo(id)

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
	videoID := vars["id"]

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

func getRepositories(r *http.Request) *repository.Repositories{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories)
}

func getPlaylistVideoRepository(r *http.Request) repository.PlaylistVideoRepository{
	return r.Context().Value(middleware.RepositoryKey).(*repository.Repositories).PlaylistVideoRepo
}

type NewVideoFormData struct {
  Source     string   `json:"source"`
  PlaylistID int      `json:"playlist_id"`
  Folder     string   `json:"folder"`
  URL        string   `json:"url"`
  Format     string   `json:"format"`
}

type ErrorResponse struct {
	Errors []string `json:"errors"`
}

func CreateVideo(w http.ResponseWriter, r *http.Request) {
	repositories := getRepositories(r)
	rootFolderPath := r.Context().Value(middleware.ConfigKey).(config.Config).FolderPath
	videoRepository := repositories.VideoRepo
	playlistRepository := repositories.PlaylistRepo 
	playlistVideoRepository :=  repositories.PlaylistVideoRepo
	tempFolderpath := files.GetTemporaryFolderPath(rootFolderPath)

  body, err := ioutil.ReadAll(r.Body)

  if err != nil {
	log.Println("Error reading request body")
    http.Error(w, "Error reading request body", http.StatusInternalServerError)
    return
  }

  var data NewVideoFormData
  err = json.Unmarshal(body, &data)
  if err != nil {
		log.Println("Error parsing JSON data")
    http.Error(w, "Error parsing JSON data", http.StatusBadRequest)
    return
  }

	errors := validateNewVideoForm(data, playlistRepository)

	if len(errors) > 0 {
		// If there are errors, return a JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Errors: errors})
		return
	}

  switch data.Source {
  case "disk":
    loadVideosFromDisk(
			data.Folder, 
			fmt.Sprint(data.PlaylistID),
      playlistVideoRepository,
			videoRepository,
			rootFolderPath, 
		)
  case "ytdlp":
    ytdlpError := loadVideoWithYtdlp(
			data.URL, 
			fmt.Sprint(data.PlaylistID),
			data.Format,
			playlistVideoRepository,
			videoRepository,
			rootFolderPath,
			tempFolderpath,
	  )

		if ytdlpError != nil{
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{Errors: []string{ytdlpError.Error()}})
			return
		}
  }
}

func getFilesWithExtensions(folderPath string, extensions []string) ([]string, error) {
	files, err := ioutil.ReadDir(folderPath)
	if err != nil {
		return nil, err
	}

	var paths []string
	for _, file := range files {
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			for _, extension := range extensions {
				if ext == extension {
					paths = append(paths, filepath.Join(folderPath, file.Name()))
					break
				}
			}
		}
	}

	return paths, nil
}

func validateNewVideoForm(data NewVideoFormData, r repository.PlaylistRepository) []string {
	var errors []string 

	if data.PlaylistID < 1 {
		errors = append(errors, "Invalid playlist")
	} else {
		_, err := r.Get(fmt.Sprint(data.PlaylistID))
		if err != nil {
		  errors = append(errors, "Could not find playlist")
		}
	}

	if data.Source == "disk" {
		if data.Folder == "" {
			errors = append(errors, "Folder cannot be blank")
		} else {
			_, err := ioutil.ReadDir(data.Folder)

			if err != nil {
				errors = append(errors, "Folder does not exist")
			}
		}
	} else if data.Source == "ytdlp" {
		if data.URL == "" {
			errors = append(errors, "URL cannot be blank")
		} else if !isValidURL(data.URL) {
			errors = append(errors, "Invalid URL")
		}
	} else {
		errors = append(errors, "Form type not disk, or ydlp")
	}

	return errors
}

func isValidURL(str string) bool {
	u, err := url.Parse(str)
	return err == nil && u.Scheme != "" && u.Host != ""
}

func loadVideosFromDisk(folderPath string, playlistID string, playlistVideoRepo repository.PlaylistVideoRepository, videoRepo repository.VideoRepository, rootFolderPath string) error {
	paths, err := getFilesWithExtensions(folderPath, []string{".mp4", ".webm"})

	if err != nil {
		log.Println("Error getting files", err)
		return err
	}

	for _, path := range paths {
    	ext := filepath.Ext(path)
		if ext != ".webm" && ext != ".mp4" {
			continue
		}

		// Get the md5 checksum
		checksum, err := computeChecksum(path)

    	if err != nil {
			log.Println("Error creating md5 checksum", err)
			continue
		}

		existingVideo, _ := videoRepo.GetBy(checksum, "md5_checksum")

		// If file already exists in DB skip it
		if (existingVideo.ID > 0) {
			log.Println("Video already exists, skipping video:", path)
			continue
		}

		// Create file_id
		fileID, err := generateFileID()
    	if err != nil {
			log.Println("Error generating fileID", path)
			continue
		}

		// Insert Video into DB
		video := models.Video{}
		video.DownloadComplete = true 
		video.DownloadDate = time.Now().Format("2006-01-02")
		video.Title = strings.TrimSuffix(filepath.Base(path), ext)
		video.FileFormat = strings.TrimPrefix(ext, ".")
		video.Md5Checksum = checksum
		video.FileID = fileID

    	duration, err := getVideoDuration(path)

		if err == nil {
			video.Duration = duration
		} else {
			log.Println("Error getting duration for video:", path, "error:", err)
		}
		
		videoID, err := videoRepo.Create(video)

		if err != nil {
			log.Println("Error inserting video into videos table", err)
			continue
		}

		// Insert playlistVideo item
		_, err = playlistVideoRepo.Create(playlistID, fmt.Sprint(videoID))

		if err != nil {
			log.Println("Error inserting plalistVideo entry into db", err)
			videoRepo.Delete(fmt.Sprint(videoID))
			continue
		}

		// Create folders to store the file
		destinationFolderPath, err := files.CreateFileFolders(rootFolderPath, fileID)
		if (err != nil)  {
      		log.Println("Error creating folders for video file", err)
			videoRepo.Delete(fmt.Sprint(videoID))
			continue
		}

		// Copy file to new destination
		err = files.CopyFile(path, filepath.Join(destinationFolderPath, fileID + ext))
    	if (err != nil)  {
      		log.Println("Error copying file to new folder", err)
			videoRepo.Delete(fmt.Sprint(videoID))
			continue
		}

		// Create a video thumbnail and save to destination
		extractThumbnail(path, filepath.Join(destinationFolderPath, fileID + ".jpg"))
    	if (err != nil)  {
      		log.Println("Error creating video thumbnail", err)
		}

		// Write to websocket so client can refresh
		ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadSuccess)})
	}

	return nil
}

// Downloads video from yt-dlp
func loadVideoWithYtdlp(url string, playlistID string, format string, playlistVideoRepository repository.PlaylistVideoRepository, videoRepository repository.VideoRepository, rootFolderPath string, tempFolderPath string) error {
	var err error

	// Get Video info
	duration, title, nil := ytdlp.ExtractVideoInfo(url)
	
	// Get yt vid id.  returns "" if not a youtube video
	ytID := extractVideoID(url)

	currentDate := time.Now().Format("2006-01-02")

	fileID, _ := generateFileID()

	//downloadVideoPath := filepath.Join(tempFolderpath, fileID) 
	downloadImgPath   := filepath.Join(tempFolderPath, fileID)
	downloadVideoPathWithExt := filepath.Join(tempFolderPath, fileID+".mp4") 
	downloadImgPathWithExt   := filepath.Join(tempFolderPath, fileID+".jpg")

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
		//http.Error(w, err.Error(), http.StatusInternalServerError)
		return err
	}
	
	id, err := playlistVideoRepository.Create(playlistID, fmt.Sprint(videoID))

	if err != nil {
		log.Println("Error inserting into playlistVideo table", id)
		return err
	}

	onDownloadExit := func(isError bool) {
		if (isError) {
			log.Println("Error during download! Notifying client.")
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadFail)})
			return
		}

		// Update video in db
		video = updateVideoOnDownloadSuccess(videoRepository, video, downloadVideoPathWithExt)

		// Save thumbnail
		thumbnail_extract_err := ytdlp.DownloadVideoThumbnail(url, downloadImgPath)

        // Add duration if its nil
		if (duration == "") {
			duration, err = getVideoDuration(downloadVideoPathWithExt)
			if (err == nil) {
				video.Duration = duration
				videoRepository.Update(video)
			} else {
				log.Println("Error extracting duration:", err)
			}
		}

		// If save unsuccessful, use FFMPEG
		if thumbnail_extract_err != nil {
			extractThumbnail(downloadVideoPathWithExt, downloadImgPathWithExt)
		}

		// Create folders where the file is located 
		folderPath, err := files.CreateFileFolders(rootFolderPath, fileID)

		if err != nil {
			log.Println(err.Error())
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadFail)})
			return
		} 

        // Split video filename into base name and extension
	  	imgBaseName := filepath.Base(downloadImgPathWithExt)
	  	videoBaseName := filepath.Base(downloadVideoPathWithExt)

		// Move video file from temp folder to the new folder
		newVideoFilePath := filepath.Join(folderPath, videoBaseName)
		err = files.MoveFile(downloadVideoPathWithExt, newVideoFilePath)
        if err != nil {
			log.Println("Error moving video file from temp folder", err)
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadFail)})
			return
		}
			
		// Move image file from temp folder to the new folder
		newImageFilePath := filepath.Join(folderPath, imgBaseName)
		err = files.MoveFile(downloadImgPathWithExt, newImageFilePath)
		if err != nil {
			log.Println("Error moving image file from temp folder", err)
			ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadFail)})
			return
		}

		// Write success message to websocket so client can refresh UI
		ws.CurrentHub.WriteToClients(ws.WebsocketMessage{Type: string(ws.VideoDownloadSuccess)})
	}

	// Download the video 
	go ytdlp.DownloadVideo(
		url, 
		format,
		downloadVideoPathWithExt, 
		onDownloadExit,
	) 

	return nil
}	

func extractThumbnail(videoPath, outputPath string) error {
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

func updateVideoOnDownloadSuccess(repo repository.VideoRepository, video models.Video, filepath string) models.Video {
	currentTime := time.Now()
	formattedTime := currentTime.Format("2006-01-02 15:04:05")
	md5Checksum, checksumErr := computeChecksum(filepath)

	if (checksumErr != nil) {
		log.Println("Error generating video file checksum") 
	}

	video.DownloadComplete = true
	video.DownloadDate = formattedTime
	video.Md5Checksum = md5Checksum

    // Prepare the SQL statement for inserting a row
	repo.Update(video)
	return video
}

type ProbeData struct {
    Streams []struct {
        Duration string `json:"duration"`
    } `json:"streams"`
}

func getVideoDuration(path string) (duration string, err error) {
    // Call ffprobe command to get duration information
   cmd := exec.Command("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path)
   output, err := cmd.Output()

    if err != nil {
       fmt.Println("Error:", err)
       return "", err
    }

   // Parse the output as a float64
   durationInSeconds, err := strconv.ParseFloat(strings.TrimSpace(string(output)), 64)
   if err != nil {
       fmt.Println("Error:", err)
       return "", err
   }

   // Convert the duration in seconds to a time.Duration
   durationTime := time.Duration(durationInSeconds * float64(time.Second))

   // Format the duration as desired
   hours := int(durationTime.Hours())
   minutes := int(durationTime.Minutes()) % 60
   seconds := int(durationTime.Seconds()) % 60

   if hours > 0 {
       return fmt.Sprintf("%d:%02d:%02d", hours, minutes, seconds), nil
   } else if minutes > 0 {
       return fmt.Sprintf("%d:%02d", minutes, seconds), nil
   } else {
       return fmt.Sprintf("%d", seconds), nil
   } 
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
