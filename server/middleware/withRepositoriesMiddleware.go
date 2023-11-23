package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"vidviewer/repository"
)

const RepositoryKey MiddleWareKey = "repositories"

func WithRepositories(repositories *repository.Repositories) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if (r.URL.Path == "/websocket" || r.URL.Path == "/config") {
                next.ServeHTTP(w, r)
                return
            }

            // Update repositories with current db
	        sql := r.Context().Value(DBKey).(*sql.DB)

            repositories.PlaylistRepo.SetDB(sql)
            repositories.VideoRepo.SetDB(sql)
            repositories.PlaylistVideoRepo.SetDB(sql)

            // Add the repositories and database connection to the request context
            ctx := context.WithValue(r.Context(), RepositoryKey, repositories)
		    r = r.WithContext(ctx)

            // Call the next handler with the updated context
            next.ServeHTTP(w, r)
        })
    }
}
