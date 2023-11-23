package config

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"gopkg.in/yaml.v2"

	_ "modernc.org/sqlite"
)

type Config struct {
	FolderPath string `yaml:"folderPath" json:"folder_path"`
}

var isTestMode bool = false

// The config directory
func getRootPath() string {
	path, _ := os.UserConfigDir()
	if isTestMode {
		return filepath.Join(path, "vidviewer-testdata")
	} else {
		return filepath.Join(path, "vidviewer")
	}
}

func GetSSLCertPath() string {
	return filepath.Join(getRootPath(), "localhost.pem")
}

func GetSSlKeyPath() string {
	return filepath.Join(getRootPath(), "localhost-key.pem")
}

func initializeSSLCert() error {
    var path = getRootPath()
	// Check if the mkcert command is available in the system's PATH
	_, err := exec.LookPath("mkcert")

	if err != nil {
		return err
	}

	// Check if the certificate files already exist in the config directory
	_, certExists := os.Stat(path + "/localhost.pem")
	_, keyExists := os.Stat(path + "/localhost-key.pem")

	if os.IsNotExist(certExists) || os.IsNotExist(keyExists) {
		// Run the mkcert command to generate the certificate files
		cmd := exec.Command("mkcert", "localhost")
		cmd.Dir = path
		err := cmd.Run()
		if err != nil {
		  return err
		}
	}

	return nil
}

func getConfigFilePath() string {
	return filepath.Join(getRootPath(), "config.yaml")
}

func Update(newConfig Config) {
	data, err := yaml.Marshal(&newConfig)

	if err != nil {
		log.Println("Error converting config to yaml")
		log.Fatal(err)
	}

	err = os.WriteFile(getConfigFilePath(), data, 0644)

	if err != nil {
		log.Println("Error writing file")
		log.Fatal(err)
	}
}

func Path() string {
	return getConfigFilePath()
}

func Initialize(_isTestMode bool) {
	isTestMode = _isTestMode

	if isTestMode {
		err := os.RemoveAll(getRootPath())
		if err != nil {
			log.Fatalf("Failed to delete config test directory: %s", err)
		}	
	}

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

	error := initializeSSLCert()
	if (error != nil) {
		log.Fatal(
			"Error initializing ssl certification:", 
			error.Error(),
		)
	}
}

// Load, or create config.yaml if necessary
func Load() Config {
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
		Update(Config{FolderPath: ""})
	}

	// NOTE this is being called on every request 
	// Read/update from memory instead?
	data, err := os.ReadFile(filePath)

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