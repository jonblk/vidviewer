package middleware

import (
	"net/http"
	"strings"
	"vidviewer/config"
	"vidviewer/errors"
	"vidviewer/files"
	ws "vidviewer/websocket"
)

func FilesMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Continue to next handler (for initialization)
		if (r.URL.Path == "/" || r.URL.Path == "/websocket" || r.URL.Path == "/config" || strings.HasPrefix(r.URL.Path, "/assets/")) {
			next.ServeHTTP(w, r)
			return
		}

	    rootFolderPath := r.Context().Value(ConfigKey).(config.Config).FolderPath 

		if (rootFolderPath == "") {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.RootFolderNotFound)})
			error := errors.RootFolderNotFoundError()
			http.Error(w, error.Error(), error.StatusCode)
		} else {
			err := files.Initialize(rootFolderPath)
			if err != nil {
			    ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.RootFolderNotFound)})
				http.Error(w, "Error creating root folder", http.StatusInternalServerError)
			}
		}
        
		next.ServeHTTP(w, r)
	})
}