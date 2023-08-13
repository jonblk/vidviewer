package handlers

import (
	"net/http"
	ws "vidviewer/websocket"

	"github.com/gorilla/websocket"
)

type WebsocketMessage struct {
	Type string `json:"type"`
}

var (
	// Configure the upgrader with the necessary settings
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Perform origin checking logic here if needed
			// Return true if the origin is allowed, false otherwise
			return true
		},
	}
	downloadStatusBroadcast = make(chan WebsocketMessage)
)

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	hub := ws.NewHub()

	ws.HandleWebSocket(hub, w, r)
}