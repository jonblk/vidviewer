package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"

	"github.com/joho/godotenv"
)

func isPortAvailable(host string, port string) bool {
	lc := net.ListenConfig{
		Control: func(network, address string, c syscall.RawConn) error {
			var opErr error
			err := c.Control(func(fd uintptr) {
				opErr = syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1)
			})
			if err != nil {
				return err
			}
			return opErr
		},
	}

	listener, err := lc.Listen(context.Background(), "tcp", net.JoinHostPort(host, port))
	if err != nil {
		fmt.Println("Listening error:", err)
		return false
	}
	defer listener.Close()
	return true
}

func getAvailablePort() (string) {
	check_ports  := []string{"8080", "8081", "8082", "8083", "8084", "8085", "8086"}

	for _, port := range check_ports {
		if isPortAvailable("localhost", port) {
			return port
		} 
	}

	return ""
}

func testRepositories() error {
	testCmd := exec.Command("go", "test", "-v")
	testCmd.Dir = "server/repository"
	testCmd.Stdout = os.Stdout
	testCmd.Stderr = os.Stderr
	err := testCmd.Run()
	return err
}

func buildClient() error {
	// Build React app
	buildCmd := exec.Command("npm", "run", "build")
	buildCmd.Dir = "./client"
	buildCmd.Stdout = os.Stdout
	buildCmd.Stderr = os.Stderr
	err := buildCmd.Run()
	return err
}

func buildServer(buildPath string, sourcePath, dir string, serverPort string, clientPort string) error {
	os.Setenv("GOOS", "linux")
	os.Setenv("GOARCH", "amd64")
	cmd := exec.Command(
		"go", 
		"build", 
		"-ldflags",
		"-X main.serverPort=" + serverPort + " -X main.clientPort=" + clientPort,
		"-o", 
		buildPath, 
		sourcePath,
	)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	return err
}

func runServer(buildPath string, mode string) (*os.Process, error) {
	cmd := exec.Command(
		buildPath, 
		"--mode=" + mode, 
	)

	// Set the command's standard output and standard error to os.Stdout and os.Stderr, respectively.
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Start()

	log.Println("Running server, with process id:", cmd.Process.Pid)

	if err != nil {
		return nil, err 
	}

	return cmd.Process, nil 
}

func runE2E(server_port string, empty_library_path string) {
	cmd := exec.Command(
		"npx", 
		"cypress", 
		"run", 
	)

	cmd.Env = append(
		os.Environ(), 
		"CYPRESS_EMPTY_LIBRARY_PATH=" + empty_library_path, 
		"CYPRESS_SERVER_PORT=" + server_port,
		//"DEBUG=cypress:*",
	)

	cmd.Dir = "./client"
	//cmd.Env = append(os.Environ(), "DEBUG=cypress:*")
	output, _ := cmd.CombinedOutput()

	fmt.Printf("Output: %s", output)
}

func RemoveContents(dir string) error {
    d, err := os.Open(dir)
    if err != nil {
        return err
    }
    defer d.Close()
    names, err := d.Readdirnames(-1)
    if err != nil {
        return err
    }
    for _, name := range names {
        err = os.RemoveAll(filepath.Join(dir, name))
        if err != nil {
            return err
        }
    }
    return nil
}

func main() {
	mode := flag.String("mode", "production", "run mode")
	flag.Parse()

	empty_library_path, err := filepath.Abs("./tests/sample_library_empty")
    if err != nil {
		log.Println("Error getting absolute path", empty_library_path)
	}

    // Get the path to the .env file
    envPath := filepath.Join(".env")

    // Load the .env file
    err = godotenv.Load(envPath)
    if err != nil {
        fmt.Println("Error loading .env file")
        return
    }

	// Access the environment variables
    serverPort := os.Getenv("SERVER_PORT")
    clientPort := os.Getenv("CLIENT_DEV_PORT")

	switch *mode {

	// --mode=test 
	// Runs the test suite:

	// 1. Run server unit tests
	// 2. Prepare and build server 
	// 3. Launch the compiled server in test mode
	// 4. Run e2e tests  

	case "test":
		// Delete the empty sample library so it is empty for tests
		RemoveContents(empty_library_path)

		err := testRepositories()
		if err != nil {
			log.Fatalf("Server repositories tests failed: %v", err)
		}

		err = buildClient()
		if err != nil {
			log.Fatalf("Building client failed: %v", err)
		}

		err = os.RemoveAll("./server/build")
		if err != nil {
			log.Fatalf("Failed to delete build directory: %v", err)
		}

		// Move build 
		err = os.Rename("./client/dist", "./server/build")
		if err != nil {
			log.Fatalf("Failed to move build directory: %v", err)
		}

		err = buildServer(
			"./../tests/app",  // build path
			"main.go",  					 // source
			"./server", 					 // directory to run 
			serverPort,
			clientPort,
		)

		if err != nil {
			log.Fatalf("Failed to build server application: %v", err)
		}

		// Delete build directory
		err = os.RemoveAll("./server/build")
		if err != nil {
			log.Fatalf("Failed to remove old build directory: %v", err)
		}

		// Run the server in test mode
		server_process, err := runServer(
			"./tests/app", 
			"test", 
		)

		if err != nil {
			log.Fatalf("Error starting test server: %v", err)
		} 

		// Run the e2e tests
		runE2E(serverPort, empty_library_path)

		if server_process != nil {
			err = server_process.Kill()
		}

		if err != nil {
			log.Fatalf("Failed to terminate server process %v", err)
		}

	case "dev":
        err := buildClient()
		if err != nil {
			log.Fatalf("Building client failed: %v", err)
		}

     	err = os.RemoveAll("./server/build")
		if err != nil {
			log.Fatalf("Failed to delete build directory: %v", err)
		}

		// Move build 
		err = os.Rename("./client/dist", "./server/build")
		if err != nil {
			log.Fatalf("Failed to move build directory: %v", err)
		}

		// Run react server in dev mode
        client_cmd := exec.Command("npm", "run", "dev")
		client_cmd.Dir = "./client"
		client_cmd.Stderr =  os.Stderr
		client_cmd.Stdout =  os.Stdout	
		err = client_cmd.Start()

		if err != nil {
			log.Fatalln("Error starting client server", err)
		}

      	// Run the server in test mode
		server_process, err := runServer(
			"./tests/app", 
			"dev", 
		)

		if err != nil {
			log.Fatalf("Error starting test server: %v", err)
		} 

		server_process.Wait()

		defer func() {
			// Delete the empty sample library so it is empty for tests
			RemoveContents(empty_library_path)
			if server_process == nil {
				err := server_process.Kill()
				if err != nil {
				log.Printf("Failed to kill process: %v", err)
				}
			}
		}()

        defer func() {
			if client_cmd.Process == nil {
				err := client_cmd.Process.Kill()
				if err != nil {
				log.Printf("Failed to kill process: %v", err)
				}
			}
		}()

	case "build":

	default:
		log.Fatalf("Invalid mode: %s", *mode)
	}
}