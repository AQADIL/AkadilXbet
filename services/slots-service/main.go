package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/slots-service/internal/config"
	"github.com/akadilxbet/slots-service/internal/handler"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))

	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		slog.Error("failed to connect to postgres", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	h := handler.New(pool, cfg.JWTSecret)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /slots/spin", h.Spin)
	mux.HandleFunc("GET /slots/balance", h.Balance)
	mux.HandleFunc("GET /health", h.Health)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: cors(mux)}

	go func() {
		slog.Info("slots-service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down slots-service")
	srv.Shutdown(context.Background())
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
