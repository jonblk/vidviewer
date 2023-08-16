package middleware

import (
	"net/http"
	"vidviewer/config"
	"vidviewer/files"
)

// Loads the config and passes it to handlers via router context
func FilesMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	    rootFolderPath := r.Context().Value(ConfigKey).(config.Config).FolderPath 

		if (rootFolderPath == "") {
			// TODO write to websocket with error_no_root_folder_path 
			http.Error(w, "Bad Request - no root folder path found", http.StatusBadRequest)
		} else {
			err := files.Initialize(rootFolderPath)
			if err != nil {
				http.Error(w, "Error creating root folder", http.StatusInternalServerError)
			}
		}
        
		next.ServeHTTP(w, r)
	})
}