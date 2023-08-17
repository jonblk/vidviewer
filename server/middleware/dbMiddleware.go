package middleware

import (
	"context"

	"log"
	"net/http"
	"vidviewer/config"
	"vidviewer/db"
	"vidviewer/files"
)

const DBKey MiddleWareKey = "Database"

//  Initializes DB (if nil) and passes it 
//  to handlers via router context
func DBMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
			next.ServeHTTP(w, r)
			return
		}

	    rootFolderPath := r.Context().Value(ConfigKey).(config.Config).FolderPath 
		dbPath := files.GetDatabasePath(rootFolderPath)

		sql, exists := db.GetDB(dbPath)

		// Initialize DB if its nil
		if (!exists) {
			// Path to database

			// Initialize database
			sql = db.Initialize(dbPath)
		}         

		if (sql == nil) {
			log.Fatal("Failed to establish database connection")
		}

		// Pass DB to context
		ctx := context.WithValue(r.Context(), DBKey, sql)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}