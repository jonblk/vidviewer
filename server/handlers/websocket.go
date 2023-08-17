package handlers

import (
	"net/http"
	ws "vidviewer/websocket"
)

type WebsocketMessage struct {
	Type string `json:"type"`
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	ws.HandleWebSocket(w, r)
}