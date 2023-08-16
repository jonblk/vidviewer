package middleware

import (
	"context"
	"net/http"
	"vidviewer/config"
)

type MiddleWareKey string 
const ConfigKey MiddleWareKey = "Config"

// Loads the config and passes it to handlers via router context
func ConfigMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c := config.Initialize()
		ctx := context.WithValue(r.Context(), ConfigKey, c)
		r = r.WithContext(ctx)
		next.ServeHTTP(w, r)
	})
}