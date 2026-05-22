package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/push-service/internal/config"
	"github.com/akadilxbet/push-service/internal/handler"
	"github.com/akadilxbet/push-service/internal/messaging"
	"github.com/akadilxbet/push-service/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	ctx := context.Background()
	db, err := pgxpool.New(ctx, cfg.PostgresDSN)
	if err != nil {
		slog.Error("postgres connect failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		slog.Error("nats connect failed", "err", err)
		os.Exit(1)
	}
	defer nc.Drain()

	repo := repository.New(db)
	pushHandler := handler.New(cfg, repo)

	// Subscribe to NATS events
	messaging.Subscribe(nc, repo, cfg)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /push/subscribe", pushHandler.Subscribe)
	mux.HandleFunc("POST /push/unsubscribe", pushHandler.Unsubscribe)
	mux.HandleFunc("POST /push/send", pushHandler.Send)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux}

	go func() {
		slog.Info("push-service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("http error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down push-service")
	srv.Shutdown(ctx)
}
