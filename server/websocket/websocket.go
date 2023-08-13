package websocketutil

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Client struct {
	Connection *websocket.Conn
}

type Hub struct {
	clients map[*Client]bool
}

type WebsocketMessage struct {
	Type string `json:"type"`
}

var CurrentHub *Hub

func NewHub() *Hub {
	if CurrentHub == nil {
		CurrentHub = &Hub{
			clients: make(map[*Client]bool),
		}
	} 
		
	return CurrentHub
}

func (hub *Hub) AddClient(client *Client) {
	hub.clients[client] = true
}

func (hub *Hub) RemoveClient(client *Client) {
	delete(hub.clients, client)
}

func (hub *Hub) WriteToClients(message WebsocketMessage) {
	for client := range hub.clients {
		err := client.Connection.WriteJSON(message)
		if err != nil {
			log.Println("Failed to write WebSocket message:", err)
		}
	}
}

func HandleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println("Failed to upgrade WebSocket connection:", err)
		return
	}

	client := &Client{
		Connection: conn,
	}

	hub.AddClient(client)

	go func() {
		defer func() {
			hub.RemoveClient(client)
			client.Connection.Close()
		}()

		for {
			// Read messages constantly and remove client if it's closed
			_, _, err := client.Connection.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Println("WebSocket connection closed:", err)
				} else {
					log.Println("Failed to read WebSocket message:", err)
				}
				break
			}
		}
	}()
}