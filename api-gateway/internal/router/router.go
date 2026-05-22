package router

import (
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/akadilxbet/api-gateway/internal/config"
	"github.com/akadilxbet/api-gateway/internal/middleware"
)

func New(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /ready", readyHandler)

	// Game routes
	mux.HandleFunc("POST /api/games/dice/play", dicePlayHandler)
	mux.HandleFunc("POST /api/games/mines/start", minesStartHandler)
	mux.HandleFunc("POST /api/games/mines/open", minesOpenHandler)
	mux.HandleFunc("POST /api/games/mines/cashout", minesCashoutHandler)

	// Auth proxy
	authTarget, _ := url.Parse("http://" + cfg.AuthServiceHTTPAddr)
	authProxy := httputil.NewSingleHostReverseProxy(authTarget)
	mux.Handle("/auth/", authProxy)

	scratchTarget, _ := url.Parse("http://" + cfg.ScratchServiceAddr)
	scratchProxy := httputil.NewSingleHostReverseProxy(scratchTarget)
	mux.Handle("/scratch/", scratchProxy)

	slotsTarget, _ := url.Parse("http://" + cfg.SlotsServiceAddr)
	slotsProxy := httputil.NewSingleHostReverseProxy(slotsTarget)
	mux.Handle("/slots/", slotsProxy)

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
