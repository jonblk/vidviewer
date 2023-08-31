package middleware

import (
	"net/http"
	"os/exec"
	ws "vidviewer/websocket"
)

// Checks if ffmpeg and Ytdlp installed on system.
// Writes error message to websocket if not found.
func FfmpegYtdlpMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If its websocket or config request let it pass for initialization
        if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
			next.ServeHTTP(w, r)
			return
		}

		var err error

		// If there is no folder path, or if folderpath does not exist
		// notify the client via websocket
		_, err = exec.LookPath("ffmpeg")

		if (err != nil) {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.FfmpegNotFound)})
			http.Error(w, "Bad Request - no ffmpeg not found", http.StatusBadRequest)
			return
		}

		_, err = exec.LookPath("yt-dlp")
        if (err != nil) {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.YtdlpNotFound)})
			http.Error(w, "Bad Request - no ytdlp not found", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}