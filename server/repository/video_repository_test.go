package repository

import (
	"database/sql"
	"fmt"
	"strconv"
	"testing"
	"time"
	"vidviewer/models"

	_ "github.com/mattn/go-sqlite3"
)

const timeFormat string = "2006-01-02" 

// Helper function to create a new VideoRepository
func newTestRepo(t *testing.T, db *sql.DB) VideoRepository {
	return VideoRepository{db: &db}
}

func createVideos(repo VideoRepository) ([]int64, error) {
  // Note changing these values will break tests
  // Todo - fix 
  videos := []models.Video {
	newVideo("Andy"), 
	newVideo("Bobo"), 
	newVideo("Steve"),
  }

  videoIDs := []int64{}

  for _, video := range videos {
    id, err := repo.Create(video)
    if err != nil {
		return nil, err
    }
    videoIDs = append(videoIDs, id)
  }

  return videoIDs, nil
} 

func createPlaylistVideos(repo PlaylistVideoRepository, playlistID string, videoIDs []int64) ([]int64, error) {
	ids := []int64{}
	for _, videoID := range videoIDs {
		id, error := repo.Create(playlistID, strconv.FormatInt(videoID, 10) )
		if error != nil {
			return nil, error
		} else {
			ids = append(ids, id)
		}
	}
	return ids, nil
}

func createPlaylists(repo PlaylistRepository) ([]string, error) {
    ids := []string{}
    names := []string{"Playlist1", "Playlist2", "Playlist3", "Playlist4"}
    for _, name := range names {
		id, err := repo.Create(name, time.Now().Format(timeFormat))
		if err == nil {
			ids = append(ids, strconv.FormatInt(id, 10))
		} else {
			return []string{}, err
		}
	}
 	return ids, nil
}

func newVideo(title ...string) models.Video{
	var _title string
	if len(title) > 0 {
		_title = title[0]
	} else {
		_title = "test_title"
	}
    return models.Video{
		DownloadDate:      time.Now().Format(timeFormat),
		Url:               "test_url",
		Title:             _title, 
		YtID:              "test_ytid",
		FileID:            RandomString(10),
		Duration:          "test_duration",
		DownloadComplete:  true,
		FileFormat:        "test_format",
		Md5Checksum:       RandomString(32),
	}
}

func TestCreate(t *testing.T) {
	db := InitializeDB(t)
	defer CleanupDB(t, db)

	// Create a VideoRepository 
	repo := newTestRepo(t, db)

    ids, err := createVideos(repo)
	if (err != nil) {
		t.Fatalf("Error creating videos %s", err)
	}

	if ids[1] != 2 {
		t.Errorf("Expected ID to be 2, got %d", ids[1])
	}
}

func TestGetBy(t *testing.T) {
	db := InitializeDB(t)
	defer CleanupDB(t, db);

	// Create a VideoRepository 
	repo := newTestRepo(t, db)

	ids, err := createVideos(repo)
	if (err != nil) {
		t.Fatalf("Error creating videos %s", err)
	}

	// Call the GetBy method with the ID and check the returned video and error
	video, err := repo.GetBy(strconv.FormatInt(ids[1], 10), "id")


	if err != nil {
		t.Errorf("Expected nil error, got %s", err)
	}

	if video == nil || video.ID != ids[1] {
		t.Errorf("Expected getBy to return video with a specified ID")
	}
}

func TestDelete(t *testing.T) {
	db := InitializeDB(t)
    defer CleanupDB(t, db)

    repo := newTestRepo(t, db)

    // Insert a video into the videos table
    id, err := repo.Create(newVideo("2021-11-02"))

    if err != nil {
        t.Fatalf("Failed to create video: %s\n", err)
    }

	idstr := strconv.FormatInt(id, 10)

    // Delete the video
    err = repo.Delete(idstr)
    if err != nil {
        t.Fatalf("Error deleting video: %s\n", err)
    }

	_, err = repo.Get(idstr)

    // Check that the video was deleted
    if err == nil {
        t.Fail()
    }

	if err != nil && err.Error() != "video not found" {
        t.Fatalf("Error deleting video: %s\n", err)
	}
}

func TestUpdate(t *testing.T) {
   db := InitializeDB(t)
   defer CleanupDB(t, db)

   repo := newTestRepo(t, db)

    _, err := createVideos(repo)
	if (err != nil) {
		t.Fatalf("Error creating videos %s", err)
	}

   // Insert a video into the videos table
   video := newVideo("2021-11-02")
   id, err := repo.Create(video)
   video.ID = id

   if err != nil {
       t.Fatalf("Failed to create video: %s\n", err)
   }

   // Update the video
   video.Title = "New Title" // Change some field
   err = repo.Update(video)

   if err != nil {
       t.Fatalf("Error updating video: %s\n", err)
   }

   // Get the video and check that it was updated
   updatedVideo, err := repo.Get(strconv.FormatInt(video.ID, 10))

   if err != nil {
       t.Fatalf("Error getting video: %s\n", err)
   }

   if updatedVideo.Title != "New Title" {
       t.Fail()
   }
}

func TestGet(t *testing.T) {
  db := InitializeDB(t)
  defer CleanupDB(t, db)

  repo := newTestRepo(t, db)

  ids, err := createVideos(repo)

  if err != nil {
    t.Fatalf("Error creating videos: %s\n", err)
  }

  idstr := strconv.FormatInt(ids[1], 10)

  // Get the video
  retrievedVideo, err := repo.Get(idstr)

  if err != nil {
      t.Fatalf("Error getting video: %s\n", err)
  }

  // Check that the retrieved video matches the original video
  if retrievedVideo.ID != ids[1] {
      t.Fail()
  }
}

func TestGetFromPlaylist(t *testing.T) {
	db := InitializeDB(t)
    defer CleanupDB(t, db)

    videoRepo := VideoRepository{db: &db}
	playlistVideoRepo := PlaylistVideoRepository{db: &db}
	playlistRepo := PlaylistRepository{db: &db}

	// Create videos
	videoIDs, err := createVideos(videoRepo)
	if err != nil {
		t.Fatalf("Error creating videos: %s", err)
	}

	// Create playlists
	playlistIDs, err := createPlaylists(playlistRepo)
	if err != nil {
		t.Fatalf("Error creating playlists: %s", err)
	}

	selectedPlaylistID := playlistIDs[1]

	// Create playlist videos
    _, err = createPlaylistVideos(playlistVideoRepo, selectedPlaylistID, videoIDs)
    if err != nil {
		t.Fatalf("Error creating videos %s", err)
	}

	// Create additional playlist videos
    _, err = createPlaylistVideos(playlistVideoRepo, playlistIDs[0], []int64{1})
	if err != nil {
		t.Fatalf("Error creating videos %s", err)
	}

	videos, err := videoRepo.GetFromPlaylist(selectedPlaylistID, 10, 1, "", 1) 

	if err != nil {
		t.Fatalf("Error %s \n", err)
	}

	// Expect that it returns correct videos

	if len(videoIDs) != len(videos) {
		t.Error("Error, wrong number of videos returned")
	}

	for _, v := range videos {
		if !Contains(videoIDs, v.ID) {
			t.Error("Error, wrong video returned")
		}
	}

	// Expect that 'like' search returns correct videos

	search := "Bobo"
	videos, err = videoRepo.GetFromPlaylist(selectedPlaylistID, 10, 1, search, 1) 

	if err != nil {
		t.Fatalf("Error %s \n", err)
	}

	for _, v := range videos {
		if v.Title != search {
			t.Error("Error, wrong video returned")
		}
	}

    videos, err = videoRepo.GetFromPlaylist(selectedPlaylistID, 10, 1, "undefined", 1) 

	if err != nil {
		t.Fatalf("Error %s \n", err)
	}

	if len(videos) > 0 {
		t.Error("Error, undefined search should return no videos")
	}

	// Expect limit / pagination to return expected result

	videos, err = videoRepo.GetFromPlaylist(
		selectedPlaylistID,
		1,  // limit
		2,  // page
		"", // search
		1,  // sort
	) 

	if err != nil {
		t.Fatalf("Error %s \n", err)
	}

	if len(videos) !=  1 {
		t.Errorf("Error, a search with limit 1 and page 2 should return only 1 video")
	}

	
    if videos[0].Title != "Bobo" {
		t.Errorf("Error, a search with limit 1 and page 2 should return the second video got:  %s", videos[0].Title)
	}

    videos, _ = videoRepo.GetFromPlaylist(
		selectedPlaylistID,
		2,  // limit
		2,  // page
		"", // search
		1,  // sort
	) 

    if videos[0].Title != "Steve" {
		t.Errorf("Error, a search with limit 2 and page 2 should return the second video got:  %s", videos[0].Title)
	}

	// Test SortBy (date) ascending 
	videos, _ = videoRepo.GetFromPlaylist(
		selectedPlaylistID,
		3,  // limit
		1,  // page
		"", // search
		1,  // sort
	) 

	video1 := videos[0]
	video1.DownloadDate = "2000-01-02"
	videoRepo.Update(video1)

    video2 := videos[1]
	video2.DownloadDate = "2000-02-02"
	videoRepo.Update(video2)

    video3 := videos[1]
	video3.DownloadDate = "2000-04-02"
	videoRepo.Update(video3)

    // Test SortBy (date) descending 
	videos, _ = videoRepo.GetFromPlaylist(
		selectedPlaylistID,
		3,  // limit
		1,  // page
		"", // search
		0,  // sort
	)

	// Parse into time.Time
	time1, err := time.Parse(time.RFC3339, videos[0].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	} 

    time2, err := time.Parse(time.RFC3339, videos[1].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	}

    time3, err := time.Parse(time.RFC3339, videos[2].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	}

	if time1.Before(time2) && time2.Before(time3) {
		t.Errorf("Expected downloadDate order to be descending")
	}

	// Test SortBy (date) ascending 
	videos, _ = videoRepo.GetFromPlaylist(
		selectedPlaylistID,
		3,  // limit
		1,  // page
		"", // search
		1,  // sort
	)

	// Parse into time.Time
	time1, err = time.Parse(time.RFC3339, videos[0].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	} 

    time2, err = time.Parse(time.RFC3339, videos[1].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	}

    time3, err = time.Parse(time.RFC3339, videos[2].DownloadDate)

	if err != nil {
		fmt.Println("Error parsing time:", err)
		return
	}

	if time1.After(time2) && time2.After(time3) {
		t.Errorf("Expected downloadDate order to be ascending")
	}
}
