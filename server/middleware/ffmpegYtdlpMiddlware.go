package middleware

import (
	"net/http"
	"os/exec"
	"vidviewer/errors"
	ws "vidviewer/websocket"
)

// Checks if ffmpeg and yt-dlp installed on system.
// Writes error message to websocket if not found.
func FfmpegYtdlpMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If its websocket or config request let it pass for initialization
        if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
			next.ServeHTTP(w, r)
			return
		}

		var err error

		_, err = exec.LookPath("ffmpeg")
		if (err != nil) {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.FfmpegNotFound)})
            error := errors.FfmpegNotFoundError()
			http.Error(w, error.Error(), error.StatusCode)
			return
		}

		_, err = exec.LookPath("yt-dlp")
        if (err != nil) {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.YtdlpNotFound)})
            error := errors.YtdlpNotFoundError()
			http.Error(w, error.Error(), error.StatusCode)
			return
		}

		next.ServeHTTP(w, r)
	})
}