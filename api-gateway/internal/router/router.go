package router

import (
	"encoding/json"
	"net/http"

	"github.com/akadilxbet/api-gateway/internal/config"
	"github.com/akadilxbet/api-gateway/internal/middleware"
)

func New(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /ready", readyHandler)

	mux.HandleFunc("POST /api/games/dice/play", dicePlayHandler)
	mux.HandleFunc("POST /api/games/mines/start", minesStartHandler)
	mux.HandleFunc("POST /api/games/mines/open", minesOpenHandler)
	mux.HandleFunc("POST /api/games/mines/cashout", minesCashoutHandler)

	return middleware.Chain(mux,
		middleware.RequestID,
		middleware.Logger,
		middleware.CORS,
		middleware.RateLimit,
	)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func readyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}
