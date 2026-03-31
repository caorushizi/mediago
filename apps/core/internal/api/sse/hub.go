package sse

import (
	"encoding/json"
	"sync"
)

// Event 表示 SSE 事件。
type Event struct {
	Name string
	Data interface{}
}

// JSON 返回事件数据的 JSON 格式。
func (e Event) JSON() string {
	payload, _ := json.Marshal(e.Data)
	return string(payload)
}

// Hub 负责维护 SSE 客户端并广播事件。
type Hub struct {
	mu      sync.RWMutex
	clients map[chan Event]struct{}
}

// New 创建 SSE Hub。
func New() *Hub {
	return &Hub{
		clients: make(map[chan Event]struct{}),
	}
}

// Subscribe 注册新的 SSE 客户端。
func (h *Hub) Subscribe() chan Event {
	h.mu.Lock()
	defer h.mu.Unlock()

	ch := make(chan Event, 10)
	h.clients[ch] = struct{}{}
	return ch
}

// Unsubscribe 注销客户端。
func (h *Hub) Unsubscribe(ch chan Event) {
	h.mu.Lock()
	if _, ok := h.clients[ch]; ok {
		delete(h.clients, ch)
		close(ch)
	}
	h.mu.Unlock()
}

// Broadcast 向所有客户端广播事件。
func (h *Hub) Broadcast(name string, data interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.clients {
		select {
		case ch <- Event{Name: name, Data: data}:
		default:
		}
	}
}
