package main

import (
	"encoding/json"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

type StartRequest struct {
	UserID    string `json:"user_id"`
	BetAmount int    `json:"bet_amount"`
	Mines     int    `json:"mines"`
}

type Game struct {
	ID         string
	UserID     string
	BetAmount  int
	Mines      map[int]bool
	Opened     map[int]bool
	Status     string
	OpenedSafe int
}

var (
	store = map[string]*Game{}
	mu    sync.Mutex
)

func main() {
	rand.Seed(time.Now().UnixNano())

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /ready", readyHandler)
	mux.HandleFunc("POST /mines/start", startHandler)
	mux.HandleFunc("POST /mines/open", openHandler)
	mux.HandleFunc("POST /mines/cashout", cashoutHandler)

	port := getEnv("MINES_SERVICE_HTTP_PORT", "8091")
	slog.Info("mines-service starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("mines-service stopped", "err", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "ok"})
}

func readyHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "ready"})
}

func startHandler(w http.ResponseWriter, r *http.Request) {
	var req StartRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.Mines <= 0 {
		req.Mines = 3
	}

	gameID := strconv.FormatInt(time.Now().UnixNano(), 10)
	mines := map[int]bool{}
	for len(mines) < req.Mines {
		mines[rand.Intn(25)] = true
	}

	game := &Game{
		ID:        gameID,
		UserID:    req.UserID,
		BetAmount: req.BetAmount,
		Mines:     mines,
		Opened:    map[int]bool{},
		Status:    "playing",
	}

	mu.Lock()
	store[gameID] = game
	mu.Unlock()

	writeJSON(w, map[string]any{
		"game_id": gameID,
		"status":  "playing",
	})
}

func openHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GameID string `json:"game_id"`
		Cell   int    `json:"cell"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	mu.Lock()
	game := store[req.GameID]
	mu.Unlock()

	if game == nil {
		http.Error(w, "game not found", http.StatusNotFound)
		return
	}

	if game.Mines[req.Cell] {
		game.Status = "lost"
		writeJSON(w, map[string]any{"safe": false, "status": "lost"})
		return
	}

	game.Opened[req.Cell] = true
	game.OpenedSafe++
	multiplier := 1 + float64(game.OpenedSafe)*float64(len(game.Mines))*0.15

	writeJSON(w, map[string]any{
		"safe":       true,
		"status":     "playing",
		"multiplier": multiplier,
	})
}

func cashoutHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GameID string `json:"game_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	mu.Lock()
	game := store[req.GameID]
	mu.Unlock()

	if game == nil {
		http.Error(w, "game not found", http.StatusNotFound)
		return
	}

	multiplier := 1 + float64(game.OpenedSafe)*float64(len(game.Mines))*0.15
	payout := int(float64(game.BetAmount) * multiplier)
	game.Status = "won"

	writeJSON(w, map[string]any{
		"status":     "won",
		"payout":     payout,
		"multiplier": multiplier,
	})
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(data)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
