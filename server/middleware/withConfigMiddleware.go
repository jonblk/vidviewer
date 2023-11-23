package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"
	"vidviewer/config"
	ws "vidviewer/websocket"
)

type MiddleWareKey string 
const ConfigKey MiddleWareKey = "Config"

// Loads the config and passes it to handlers via router context
func ConfigMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c := config.Load()
		ctx := context.WithValue(r.Context(), ConfigKey, c)
		r = r.WithContext(ctx)

		// skip middleware (for initialization)
        if (r.URL.Path == "/" || r.URL.Path == "/websocket" || r.URL.Path == "/config" || strings.HasPrefix(r.URL.Path, "/assets/")) {
			next.ServeHTTP(w, r)
			return
		}

		// If there is no folder path, or if folderpath does not exist
		// notify the client via websocket
		if (c.FolderPath == "") {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.RootFolderNotFound)})
			http.Error(w, "Bad Request - no root folder path found", http.StatusBadRequest)
			return
		}

        if _, err := os.Stat(c.FolderPath); err != nil && os.IsNotExist(err) {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.RootFolderNotFound)})
			http.Error(w, "Bad Request - no root folder path found", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}