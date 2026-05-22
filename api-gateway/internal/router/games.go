package router

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type DiceRequest struct {
	UserID    string `json:"user_id"`
	BetAmount int    `json:"bet_amount"`
}

type DiceResponse struct {
	DiceValue  int     `json:"dice_value"`
	Result     string  `json:"result"`
	Multiplier float64 `json:"multiplier"`
	Payout     int     `json:"payout"`
}

type MinesStartRequest struct {
	UserID    string `json:"user_id"`
	BetAmount int    `json:"bet_amount"`
	Mines     int    `json:"mines"`
}

type MinesGame struct {
	ID         string
	UserID     string
	BetAmount  int
	Mines      map[int]bool
	Opened     map[int]bool
	Status     string
	OpenedSafe int
}

var (
	minesStore = map[string]*MinesGame{}
	minesMu    sync.Mutex
)

func dicePlayHandler(w http.ResponseWriter, r *http.Request) {
	var req DiceRequest
	json.NewDecoder(r.Body).Decode(&req)

	dice := rand.Intn(6) + 1
	result := "lost"
	payout := 0

	if dice >= 4 {
		result = "won"
		payout = req.BetAmount * 2
	}

	writeJSON(w, DiceResponse{
		DiceValue:  dice,
		Result:     result,
		Multiplier: 2.0,
		Payout:     payout,
	})
}

func minesStartHandler(w http.ResponseWriter, r *http.Request) {
	var req MinesStartRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Mines <= 0 {
		req.Mines = 3
	}

	gameID := strconv.FormatInt(time.Now().UnixNano(), 10)
	mines := map[int]bool{}

	for len(mines) < req.Mines {
		mines[rand.Intn(25)] = true
	}

	game := &MinesGame{
		ID:        gameID,
		UserID:    req.UserID,
		BetAmount: req.BetAmount,
		Mines:     mines,
		Opened:    map[int]bool{},
		Status:    "playing",
	}

	minesMu.Lock()
	minesStore[gameID] = game
	minesMu.Unlock()

	writeJSON(w, map[string]any{
		"game_id": gameID,
		"status":  "playing",
	})
}

func minesOpenHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GameID string `json:"game_id"`
		Cell   int    `json:"cell"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	minesMu.Lock()
	game := minesStore[req.GameID]
	minesMu.Unlock()

	if game == nil {
		http.Error(w, "game not found", http.StatusNotFound)
		return
	}

	if game.Mines[req.Cell] {
		game.Status = "lost"
		writeJSON(w, map[string]any{
			"safe":   false,
			"status": "lost",
		})
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

func minesCashoutHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GameID string `json:"game_id"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	minesMu.Lock()
	game := minesStore[req.GameID]
	minesMu.Unlock()

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
	json.NewEncoder(w).Encode(data)
}
