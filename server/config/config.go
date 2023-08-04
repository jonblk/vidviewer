package config

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"strings"

	"gopkg.in/yaml.v2"

	_ "modernc.org/sqlite"
)

type Config struct {
	FolderPath string `yaml:"folderPath"`
}

func getRootPath() string {
	path, _ := os.UserConfigDir()
	return filepath.Join(path, "vidviewer")
}

func getConfigFilePath() string {
	return filepath.Join(getRootPath(), "config.yaml")
}

func update(newConfig Config) {
	data, err := yaml.Marshal(&newConfig)

	if err != nil {
		log.Println("Error converting config to yaml")
		log.Fatal(err)
	}

	err = ioutil.WriteFile(getConfigFilePath(), data, 0644)

	if err != nil {
		log.Println("Error writing file")
		log.Fatal(err)
	}
}

// Load, or create config.yaml if necessary
func Load() *Config {
	filePath := getConfigFilePath()

	log.Println(getRootPath())

	// Create root config folder if it doesn't exist
	if _, err := os.Stat(getRootPath()); err != nil && os.IsNotExist(err) {
		err := os.Mkdir(getRootPath(), os.ModePerm)
		if err != nil {
			log.Println("ERROR making config directory")
			log.Println(err)
		}
	} else if err != nil {
		fmt.Println("Error:", err)
		panic(err)
	}

	// Check if the config file exists
	// and create it if it doesn't
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		var folderPath string

		// Ask user for the files folder path
		// where they will store their videos
		fmt.Println("Please input the path to the root folder for file storage.  If you haven't already created such a folder, please create it now.  For example you can call it vidviewer, or video_data.  Now enter the path to this folder...")

		fmt.Scanln(&folderPath)
		folderPath = strings.TrimSpace(folderPath)

		_, err := os.Stat(folderPath)

		if err != nil {
			if os.IsNotExist(err) {
				fmt.Println("Folder path does not exist.")
				Load()
			} else {
				fmt.Println("Error:", err)
				panic(err)
			}
		} else {
			fmt.Println("Okay, setting up the folder: "+folderPath, folderPath)
			update(Config{FolderPath: folderPath})
		}
	}

	// Load
	data, err := ioutil.ReadFile(filePath)

	if err != nil {
		log.Println("Error config file does not exist!")
		panic(err)
	}

	config := &Config{}

	err = yaml.Unmarshal(data, &config)

	if err != nil {
		log.Println("Error converting yaml to config")
		panic(err)
	}

	return config
}
