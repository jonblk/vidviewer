package ytdlp

import (
	"bytes"
	"log"
	"os"
	"os/exec"
	"strings"
)

type Format struct {
	FormatID string `json:"format_id"`
	Ext      string `json:"ext"`
	Resolution      string `json:"resolution"`
	Filesize string `json:"filesize"`
}

func GetFormats(url string) ([]Format, error) {
	cmd := exec.Command("yt-dlp", "--list-formats", url)

	output, err := cmd.Output()

	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(output), "\n")

	log.Println(lines)

	formats := []Format{}

	for _, line := range lines {
		if strings.Contains(line, "|") {
			fields := strings.Fields(line)

			// currently only return mp4 
			if fields[1] != "mp4" {
				continue
			}
				
			format := Format{
				FormatID:   fields[0],
				Ext:        fields[1],
				Resolution: fields[2],
			}
			formats = append(formats, format)
		}
	}

	return formats, nil
}

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

func DownloadVideo(url string, format string, filepath string, callback func(v bool)) {
	// Set the desired video quality in the format string
	if format == "" {
	  format = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
	}  else {
	  format = format + "+bestaudio/best"
	} 

	log.Println("Video format: " + format)

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
			interrupted = true
		} else {
			interrupted = true
		}
	}

	log.Println("Video download complete")
	callback(interrupted)
}

