package middleware

import (
	"context"
	"net/http"
	"vidviewer/repository"
)

const RepositoryKey MiddleWareKey = "repositories"

func WithRepositories(repositories *repository.Repositories) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Add the repositories and database connection to the request context
            ctx := context.WithValue(r.Context(), RepositoryKey, repositories)
            // Call the next handler with the updated context
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}
