package middleware

import (
	"context"
	"net/http"
	"vidviewer/downloadManager"
	"vidviewer/repository"
)

const DownloadManagerKey MiddleWareKey = "DownloadManagerKey"

func WithDownloadManagerMiddleware(dm *downloadManager.DownloadManager) func(http.Handler) http.Handler {
  	return func(next http.Handler) http.Handler {
    	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
                next.ServeHTTP(w, r)
                return
            }
	        videoRepo := r.Context().Value(RepositoryKey).(*repository.Repositories).VideoRepo
			
			// Initialize the download manager
			if (!dm.IsInitialized) {
				dm.Initialize(videoRepo)
			}
			r = r.WithContext(context.WithValue(r.Context(), DownloadManagerKey, dm))
			next.ServeHTTP(w, r)
		})
	}
}
