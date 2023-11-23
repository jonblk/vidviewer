package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/joho/godotenv"
)

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func copyDir(src, dst string) error {
	si, err := os.Stat(src)
	if err != nil {
		return err
	}
	if !si.IsDir() {
		return copyFile(src, dst)
	}

	err = os.MkdirAll(dst, si.Mode())
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			err = copyDir(srcPath, dstPath)
			if err != nil {
				return err
			}
		} else {
			err = copyFile(srcPath, dstPath)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func testRepositories() error {
	testCmd := exec.Command("go", "test", "-v")
	testCmd.Dir = "server/repository"
	testCmd.Stdout = os.Stdout
	testCmd.Stderr = os.Stderr
	err := testCmd.Run()
	return err
}

func buildClient(mode string) error {
	// Build React app
	cmd := exec.Command("sh", "-c", "./node_modules/.bin/tsc && ./node_modules/.bin/vite build --mode " + mode)
	cmd.Dir = "./client"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
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


	if err != nil {
		return nil, err 
	} 

	log.Println("Running server with process id:", cmd.Process.Pid)

	return cmd.Process, nil 
}

func runE2E(isCypressHeadless bool, mode string, server_port string, empty_library_path string, sample_library_path string) {
	var head string = ""
	if !isCypressHeadless && mode == "run" {
		head = "--headed" 
	} 

	if mode != "run" && mode != "open" {
		log.Fatal("Unrecognized cypress mode, should be `open` or `run`")
	}
	cmd := exec.Command(
		"npx", 
		"cypress", 
		mode, 
		head,
	)

	cmd.Env = append(
		os.Environ(), 
		"CYPRESS_EMPTY_LIBRARY_PATH=" + empty_library_path, 
		"CYPRESS_SAMPLE_LIBRARY_PATH=" + sample_library_path, 
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
	flag.String("headless", "", "run cypress headless mode")

	cypressMode := flag.String("cypress_mode", "run", "run cypress mode")
	mode := flag.String("mode", "production", "run mode")
	flag.Parse()

	var isCypressHeadless  = flag.Lookup("headless") != nil

	empty_library_path, err := filepath.Abs("./tests/sample_library_empty")
    if err != nil {
		log.Fatal("Error getting absolute path ", err)
	}
	// Create a channel to receive OS signals
	sigs := make(chan os.Signal, 1)

	// `signal.Notify` registers the given channel to
	// receive notifications of the specified signals.
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)


    sample_library_path, err := filepath.Abs("./tests/sample_library_temp")
    if err != nil {
		log.Fatal("Error getting absolute path ", err)
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

    serverPortTest := os.Getenv("SERVER_PORT_TEST")
    clientPortTest := os.Getenv("CLIENT_DEV_PORT_TEST")

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

		// Delete temp sample library
		err := os.RemoveAll("tests/sample_library_temp")
		if err != nil {
			log.Println(err)
		}

		err = copyDir("tests/sample_library", "tests/sample_library_temp")
		if err != nil {
			panic(err)
		}

		err = testRepositories()
		if err != nil {
			log.Fatalf("Server repositories tests failed: %v", err)
		}

		err = buildClient("test")
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
			serverPortTest,
			clientPortTest,
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
		runE2E(isCypressHeadless, *cypressMode, serverPortTest, empty_library_path, sample_library_path)

		if server_process != nil {
			err = server_process.Kill()
		}

		if err != nil {
			log.Fatalf("Failed to terminate server process %v", err)
		}

		defer func(){
			RemoveContents(empty_library_path)

			// Delete temp sample library
			err = os.RemoveAll("tests/sample_library_temp")
			if err != nil {
				log.Println(err)
			}
		}()
		

	case "dev":
        err := buildClient("dev")
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

        // Build Server
        err = buildServer(
			"./../build/app",  // build path
			"main.go",  					 // source
			"./server", 					 // directory to run 
			serverPort,
			clientPort,
		)

		if err != nil {
			log.Fatalf("Failed to build server: %v", err)
		} 

      	// Run the server in dev mode
		server_process, err := runServer(
			"./build/app", 
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

	// The program will wait here until it gets the
	// expected signal (Ctrl+C) from the OS.
	sig := <-sigs
	fmt.Println()
	fmt.Println(sig)

	// Delete the empty sample library so it is empty for tests
	RemoveContents(empty_library_path)

	// Delete temp sample library
	err = os.RemoveAll("tests/sample_library_temp")
	if err != nil {
		log.Println(err)
	}

	os.Exit(0)
}