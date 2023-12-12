package ytdlp

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"log"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

type Format struct {
	FormatID string `json:"format_id"`
	Ext      string `json:"ext"`
	Resolution      string `json:"resolution"`
	Filesize string `json:"filesize"`
}

// Get the various format ids and their resolutions 
// Run yt-dlp --list-formats (url) to see the output in your terminal
// Currently only mp4 extensions are returned
func GetFormats(url string) ([]Format, error) {
	cmd := exec.Command("yt-dlp", "--list-formats", url)

	output, err := cmd.Output()

	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(output), "\n")

	formats := []Format{}

	// Iterate through each line
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

    output, err := cmd.CombinedOutput()
    if err != nil {
        fmt.Printf("Command's output:\n%s\n", string(output))
        return err
    }
    
    outputStr := string(output)
    if strings.Contains(outputStr, "There are no video thumbnails to download") {
        return errors.New("no video thumbnails to download")
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

	title := ""
	duration :=  ""

	if (len(info) > 0) {
		title = strings.TrimSpace(info[0])
	} 
	
	if (len(info) > 1 ) {
		duration = strings.TrimSpace(info[1])
	}

	if duration == "" {
		log.Println("Failed to extract video duration")
	}

	if title == "" {
		log.Println("Failed to extract video title")
	}

	return duration, title, err
}

func CreateDownloadCommand(url string, format string, filePath string) *exec.Cmd {
   // Set the desired video quality in the format string
    if format == "" {
        format = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]"
    } else {
        format = format + "+bestaudio[ext=m4a]/best[ext=mp4]"
    } 

    return exec.Command("yt-dlp", "-c", "--newline", "-f", format, "-o", filePath, url)
}

func RunDownload(cmd *exec.Cmd, onReadProgress func(progress uint, speed string), onComplete func(), onError func(err error)) {
	// Create a pipe to capture the output
	stdout, _ := cmd.StdoutPipe()

	// Start the command
	if err := cmd.Start(); err != nil {
		onError(err)
		return
	}

	// Create a scanner to read the output line by line
	scanner := bufio.NewScanner(stdout)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "frag") && strings.HasPrefix(line, "[download]") {
			// "[download] 0.3% of 363.35KiB at 709.34KiB/s ETA 00:00"
			parts := strings.Fields(line)
			if len(parts) >= 8 {
				speed := parts[6]
        		p := strings.TrimSuffix(parts[1], "%")
				pf, err := strconv.ParseFloat(p, 64)
				if err != nil {
					onReadProgress(0, parts[6])
				} else {
					pf = math.Min(100, pf)
					percentage := uint(pf)
					onReadProgress(percentage, speed)
				}
	 		} 
		}
	}

	err := cmd.Wait()

	if _, ok := err.(*exec.ExitError); ok {
		// Cancelled download, or error during downloading
	} else if err != nil {
		// Some other error
		onError(err)
	} else {
		onComplete()
	}
}