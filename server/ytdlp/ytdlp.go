package ytdlp

import (
	"bytes"
	"log"
	"os"
	"os/exec"
	"strings"
)

func DownloadVideoThumbnail(videoURL, outputPath string) error {
	// Run the yt-dlp command to extract the thumbnail
	cmd := exec.Command("yt-dlp", "--write-thumbnail", "--skip-download", "--convert-thumbnails", "jpg",  "-o", outputPath, videoURL)
	err := cmd.Run()
	if err != nil {
		return err
	}

	return nil
}

func ExtractVideoInfo(url string) (string, string, error) {
    cmd := exec.Command("yt-dlp", "--get-duration", "--get-title", url)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		log.Println("Error executing command:", err)
		log.Println("Command output (stderr):", stderr.String())
	}

	info := strings.Split(strings.TrimSpace(stdout.String()), "\n")

	log.Println(info)

	title := strings.TrimSpace(info[0])
	duration := strings.TrimSpace(info[1])

	if duration == "" {
		log.Println("Failed to extract video duration")
	}

	if title == "" {
		log.Println("Failed to extract video title")
	}

	return duration, title, nil
}

func DownloadVideo(url string, filepath string, callback func()) {
	// Set the desired video quality in the format string
	format := "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"

    // Define command and arguments
    cmd := exec.Command("yt-dlp", "-f", format, "-o", filepath, url)

    cmd.Stderr = os.Stderr

    // Start the command
    err := cmd.Start()
    if err != nil {
        log.Fatalf("Failed to execute command: %v", err)
    }

    // Flag to track interruption status
    interrupted := false

	// Check if the command has finished
	err = cmd.Wait()
	if err != nil {
		// Set the interrupted flag if the command was interrupted
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == -1 {
			log.Println("Download finished successfully")
			interrupted = true
		} else {
			log.Fatalf("Download execution failed: %v", err)
		}
	}
	// Call the callback function once the download is finished and not interrupted
	if !interrupted {
		log.Println("Calling callback to clean up video files")
		callback()
	}
}

