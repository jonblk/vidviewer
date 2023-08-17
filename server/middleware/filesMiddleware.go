package middleware

import (
	"net/http"
	"vidviewer/config"
	"vidviewer/files"
	ws "vidviewer/websocket"
)

// Loads the config and passes it to handlers via router context
func FilesMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
			next.ServeHTTP(w, r)
			return
		}

	    rootFolderPath := r.Context().Value(ConfigKey).(config.Config).FolderPath 

		if (rootFolderPath == "") {
			ws.GetHub().WriteToClients(ws.WebsocketMessage{Type: string(ws.RootFolderNotFound)})
			http.Error(w, "Bad Request - no root folder path found", http.StatusBadRequest)
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