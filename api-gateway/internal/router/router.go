package router

import (
	"encoding/json"
	"net/http"

	"github.com/akadilxbet/api-gateway/internal/config"
	"github.com/akadilxbet/api-gateway/internal/handler"
	"github.com/akadilxbet/api-gateway/internal/middleware"
)

func New(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /ready", readyHandler)

	aviatorProxy := handler.NewReverseProxy(cfg.AviatorHTTPURL)
	balloonProxy := handler.NewReverseProxy(cfg.BalloonHTTPURL)
	mux.Handle("/api/v1/aviator/", aviatorProxy)
	mux.Handle("/api/v1/balloon/", balloonProxy)

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
