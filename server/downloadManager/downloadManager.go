package downloadManager

import (
	"errors"
	"fmt"
	"log"
	"os/exec"
	"sort"
	"time"
	"vidviewer/models"
	"vidviewer/repository"
	ws "vidviewer/websocket"
)

type Download struct {
  Command *exec.Cmd
  TimeStarted int64 
  TimeCompleted int64
  IsCancelled bool
  Video models.Video
  Progress uint
  Speed string
  Cancel chan bool
  Pause chan bool
  IsComplete bool
  IsPaused bool
  IsError bool
  ErrorMsg string
}

type DownloadJSON struct {
  TimeStarted   int64 `json:"time_started"`
  TimeCompleted int `json:"time_completed"`
  IsCancelled   bool `json:"is_cancelled"`
  IsComplete bool `json:"is_complete"`
  IsError    bool `json:"is_error"`
  IsPaused   bool `json:"is_paused"`
  Title      string `json:"title"`
  URL        string `json:"url"`
  VideoID    int64 `json:"video_id"`
  Progress   uint `json:"progress"`
  Speed      string `json:"speed"`
}

type DownloadManager struct {
  IsInitialized bool;
  Downloads map[string]*Download;
}

var statuses map[string]DownloadJSON

func NewDownloadManager() *DownloadManager {
  return &DownloadManager{
		Downloads: make(map[string]*Download),
	}
}

func (d *Download) OnStartDownload(cmd *exec.Cmd) {
  d.TimeStarted = time.Now().Unix()
  for {
    select {
    case <- d.Cancel:
      if err := cmd.Process.Kill(); err != nil {
        log.Printf("error during video cancel - failed to kill ytdlp process: %v", err)
      }
      return
    }
  }
}

func (d *Download) OnCancel() {
	close(d.Cancel)
  d.IsCancelled = true
}

func (d *Download) OnPause() {
	d.Pause <- true
}

func (d *Download) OnComplete() {
  d.IsComplete = true
  d.TimeCompleted = time.Now().Unix()
}

func (dm *DownloadManager) Initialize(repo repository.VideoRepository) {
  videos, err := repo.GetIncompleteDownloads()

  if (err == nil) {
    for _, video := range videos {
      log.Println("adding incomplete download: ", video.Title)
      dm.AddPreviousDownload(video)
    }
    dm.IsInitialized = true
    go dm.startStatusUpdates()
  }
}

func (dm *DownloadManager) startStatusUpdates() {
  statuses = make(map[string]DownloadJSON)
  ticker := time.NewTicker(1 * time.Second)
  var isUpdate bool
  var prevIsUpdate = true

  for range ticker.C {
    isUpdate = false
    
    for key, d := range dm.Downloads {
      if !d.IsCancelled && !d.IsComplete {
        isUpdate = true 
      }

      statuses[key] = DownloadJSON {
        TimeStarted: d.TimeStarted,
        VideoID: d.Video.ID,
        IsComplete: d.IsComplete,
        IsCancelled: d.IsCancelled,
        IsError: d.IsError,
        IsPaused: d.IsPaused,
        URL: d.Video.Url,
        Title: d.Video.Title,
        Progress: d.Progress,
        Speed: d.Speed,
      } 
    }

    if prevIsUpdate {
      // Create array(slice) of download statuses, sort by time started
      arr := make([]DownloadJSON, 0, len(statuses))
      for k := range statuses {
        arr = append(arr, statuses[k])
        sort.Slice(arr, func(i, j int) bool {
            return arr[i].TimeStarted > arr[j].TimeStarted
        })
      }

      if len(arr) > 10 {
        arr = arr[:10]
      }

      // Write download statuses to client via websocket
      ws.CurrentHub.WriteToClients(ws.WebsocketMessage {
        Type: string(ws.DownloadStatus),
        Payload:  arr,
      })
    }

    prevIsUpdate = isUpdate
  }
}

// Send cancel event to download channel
func (dm *DownloadManager) CancelDownload(key string) (*Download, error){
  d := dm.GetDownload(key)
  if d == nil {
    log.Println("Error while trying to cancel download, download does not exist:", key)
    return nil, errors.New("download not found") 
  } else {
    d.OnCancel()
    return d, nil
  }
}

func (dm *DownloadManager) OnResumeDownload(key string) error {
  d := dm.GetDownload(key)
  if d == nil {
    return errors.New("download not found")
  } else {
    d.IsPaused = false
    return nil
  }
}

func (dm *DownloadManager) GetDownload(key string) *Download{
  return dm.Downloads[key]
}

func (dm *DownloadManager) AddPreviousDownload(video *models.Video) {
  key := fmt.Sprint(video.ID)

	d := &Download {
    TimeCompleted: 0,
    TimeStarted: time.Now().Unix(),
    IsCancelled: false,
    IsComplete: false,
		Video: *video,
		IsPaused: true,
		Progress: 0,
		Speed: "",
		Cancel: make(chan bool),
		Pause: make(chan bool),
	}

	dm.Downloads[key] = d
}

func (dm *DownloadManager) AddNewDownload(video models.Video) (*Download, error) {
  key := fmt.Sprint(video.ID)

	d := &Download {
    TimeCompleted: 0,
    TimeStarted: time.Now().Unix(),
    IsCancelled: false,
    IsComplete: false,
		Video: video,
		IsPaused: false,
		Progress: 0,
		Speed: "",
		Cancel: make(chan bool),
		Pause: make(chan bool),
	}

	dm.Downloads[key] = d

	return d, nil
}
