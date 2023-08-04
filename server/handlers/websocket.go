package handlers

import (
	"log"
	"net/http"

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
	// Check if the request is coming from port 5173
	origin := r.Header.Get("Origin")
	if origin != "" && r.Host == "localhost:5173" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	}

	// Upgrade the HTTP connection to a WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade to WebSocket", http.StatusInternalServerError)
		return
	}
	
	defer func() {
		// Add logging statement to track connection closure
		log.Println("WebSocket connection closed")
		conn.Close()
	}()

	for {
		select {
		case message := <-downloadStatusBroadcast:
			err := conn.WriteJSON(message)
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
					log.Println("WebSocket connection closed unexpectedly:", err)
				} else {
					log.Println("Error writing message to client:", err)
				}
				return
			}
		}
	}
}

func SendMessageToDownloadStatusBroadcast(message WebsocketMessage) {
	downloadStatusBroadcast <- message
}

