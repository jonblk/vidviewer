package files

import (
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

func DeleteFilesWithPrefix(root, prefix string) error {
	return filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasPrefix(info.Name(), prefix) {
			return os.Remove(path)
		}

		return nil
	})
}

func GetTemporaryFolderPath(rootPath string) string {
	return filepath.Join(rootPath, "temp")
}

// BUG 
// If there is a space in folder name it silently fails
// when initializing sql db. 
func GetDatabasePath(rootPath string) string {
	return filepath.Join(rootPath, "database.db") 
}

func getFilesFolderPath(rootPath string) string {
	return filepath.Join(rootPath, "files")
}

// Check if the data folders exist
// If not they are created
func Initialize(rootPath string) error {
    err := ValidateRootDataFolder(rootPath)
	if (err != nil)  {
		return err
	}
	CreateFilesFolder(rootPath)
    if (err != nil)  {
		return err
	}
	CreateTempFolder(rootPath)
    if (err != nil)  {
		return err
	}
	return nil
}

// Creates the root data folder
// This is where the database and video files and images are stored.
func ValidateRootDataFolder(rootPath string) error {
	var err error
	if _, err = os.Stat(rootPath); errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

// This is where the video files are stored.
func CreateFilesFolder(rootPath string) error {
	path := filepath.Join(rootPath, "files")
	var err error
	if _, err = os.Stat(path); errors.Is(err, os.ErrNotExist) {
		err := os.Mkdir(path, os.ModePerm)
		if err != nil {
			log.Println("ERROR making files directory")
		}
	}
	return err
}

// Creates a temporary folder 
// This is where video files and images are 
// temporarly stored while downloading. 
func CreateTempFolder(rootPath string) error {
	path := GetTemporaryFolderPath(rootPath)
	var err error
	if _, err = os.Stat(path); errors.Is(err, os.ErrNotExist) {
		err := os.Mkdir(path, os.ModePerm)
		if err != nil {
			log.Println("ERROR making directory")
			log.Println(err)
		}
	}
	return err
}

func OnCancelDownload(rootPath string, fileID string) {
    err := DeleteFilesWithPrefix(GetTemporaryFolderPath(rootPath), fileID)
	if err != nil {
		log.Println("Error while trying to delete temperary files for video file ID: ", fileID, "\n\n error msg: ", err)
	}
}

func GetFilePath(rootFolderPath string, fileID string, fileFormat string) string {
	return filepath.Join(getFilesFolderPath(rootFolderPath), fileID[:2], fileID[2:4], fileID[4:6], fileID+"."+fileFormat)
}

// Saves the video and thumbnail into the appropriate
// root folder, creating sub folders according to fileID 
func CreateFileFolders(rootPath string, fileID string) (string, error) {
	// Check if rootPath exists, create if it doesn't
	if _, err := os.Stat(rootPath); os.IsNotExist(err) {
		err := os.MkdirAll(rootPath, os.ModePerm)
		if err != nil {
			return "", err
		}
	}

	// Generate unique folder name based on hashing mechanism
	folderPath := filepath.Join(getFilesFolderPath(rootPath), fileID[:2], fileID[2:4], fileID[4:6])

	// Create new folder if it doesn't exist
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		err := os.MkdirAll(folderPath, os.ModePerm)
		if err != nil {
			return "", err
		}
	}

	/*
	// Move video file to the new folder
	newVideoFilePath := filepath.Join(folderPath, videoBaseName)
	vidRenameError := os.Rename(videoPath, newVideoFilePath)
	if vidRenameError != nil {
		return "", vidRenameError
	}

    // Move image file to the new folder
	newImageFilePath := filepath.Join(folderPath, imgBaseName)
	imgRenameError := os.Rename(imgPath, newImageFilePath)
	if imgRenameError != nil {
		return "", imgRenameError
	}
	*/

	return folderPath, nil
}

func MoveFile(oldPath string, newPath string) error {
	err := os.Rename(oldPath, newPath)
	return err
}

func CopyFile(from string, to string) error {
	srcFile, err := os.Open(from)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	destFile, err := os.Create(to)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)
	if err != nil {
		return err
	}
	return nil
}


// Deletes the video file and thumbnail
// Then deletes the containing folders if they are empty after deletions
func OnDeleteVideo(rootPath, fileID, fileEXT, imgEXT string) error {
	var fileFolderPath string = getFilesFolderPath(rootPath)
	videoPath := filepath.Join(fileFolderPath, fileID[:2], fileID[2:4], fileID[4:6], fileID+"."+fileEXT)

	// Delete the video file
	err := os.Remove(videoPath)
	if err != nil {
		return fmt.Errorf("failed to delete the video file: %w", err)
	}

	imagePath := filepath.Join(fileFolderPath, fileID[:2], fileID[2:4], fileID[4:6], fileID+"."+imgEXT)

	// Delete the image file
	err = os.Remove(imagePath)
	if err != nil {
		return fmt.Errorf("failed to delete the image file: %w", err)
	}

	// Delete containing folders up to the root folder if they are empty
	for path := filepath.Dir(videoPath); path != fileFolderPath ; path = filepath.Dir(path) {
		// Check if the folder is empty
		isEmpty, err := isFolderEmpty(path)
		if err != nil || !isEmpty {
			break
		}

        err = os.Remove(path)
		if err != nil {
			break
		}
	}

	return nil
}

// Checks if a folder is empty
func isFolderEmpty(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()

	_, err = f.Readdirnames(1)
	if err == nil {
		// Folder is not empty
		return false, nil
	}

	// Check if it's an empty folder
	if err.Error() == "EOF" {
		return true, nil
	}

	return false, err
}