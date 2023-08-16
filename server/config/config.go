package config

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

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
func Initialize() Config {
	filePath := getConfigFilePath()

	// Create root config folder if it doesn't exist
	if _, err := os.Stat(getRootPath()); err != nil && os.IsNotExist(err) {
		err := os.Mkdir(getRootPath(), os.ModePerm)
		if err != nil {
			log.Println("ERROR making config directory")
			log.Println(err)
		}
	} else if err != nil {
		fmt.Println("Error trying to get root path info: ", err)
		panic(err)
	}

	// Check if the config file exists
	// and create it if it doesn't
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		update(Config{FolderPath: ""})
	}

	// Load
	data, err := ioutil.ReadFile(filePath)

	if err != nil {
		log.Println("Error reading config file!")
		panic(err)
	}

	config := Config{}

	err = yaml.Unmarshal(data, &config)

	if err != nil {
		log.Println("Error converting yaml to Config")
		panic(err)
	}

	return config
}
