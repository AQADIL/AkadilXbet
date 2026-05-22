package main

import (
	"encoding/json"
	"log/slog"
	"math/rand"
	"net/http"
	"os"
	"time"
)

type PlayRequest struct {
	UserID    string `json:"user_id"`
	BetAmount int    `json:"bet_amount"`
}

type PlayResponse struct {
	DiceValue  int     `json:"dice_value"`
	Result     string  `json:"result"`
	Multiplier float64 `json:"multiplier"`
	Payout     int     `json:"payout"`
}

func main() {
	rand.Seed(time.Now().UnixNano())

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /ready", readyHandler)
	mux.HandleFunc("POST /higher-lower/play", playHandler)
	mux.HandleFunc("POST /dice/play", playHandler)

	port := getEnv("HIGHER_LOWER_SERVICE_HTTP_PORT", "8092")
	slog.Info("higher-lower-service starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("higher-lower-service stopped", "err", err)
		os.Exit(1)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "ok"})
}

func readyHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "ready"})
}

func playHandler(w http.ResponseWriter, r *http.Request) {
	var req PlayRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	dice := rand.Intn(6) + 1
	result := "lost"
	payout := 0

	if dice >= 4 {
		result = "won"
		payout = req.BetAmount * 2
	}

	writeJSON(w, PlayResponse{
		DiceValue:  dice,
		Result:     result,
		Multiplier: 2.0,
		Payout:     payout,
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
