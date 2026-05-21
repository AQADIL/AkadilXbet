package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/auth-service/internal/cache"
	"github.com/akadilxbet/auth-service/internal/config"
	deliverygrpc "github.com/akadilxbet/auth-service/internal/delivery/grpc"
	authhttp "github.com/akadilxbet/auth-service/internal/delivery/http"
	"github.com/akadilxbet/auth-service/internal/events"
	"github.com/akadilxbet/auth-service/internal/repository/postgres"
	"github.com/akadilxbet/auth-service/internal/server"
	"github.com/akadilxbet/auth-service/internal/usecase"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	db, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		slog.Error("failed to connect to postgres", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := ensureSchema(context.Background(), db); err != nil {
		slog.Error("failed to ensure schema", "err", err)
		os.Exit(1)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
	})
	defer rdb.Close()

	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		slog.Error("failed to connect to nats", "err", err)
		os.Exit(1)
	}
	defer nc.Drain()

	userRepo := postgres.NewUserRepo(db)
	userCache := cache.NewUserCache(rdb)
	publisher := events.NewPublisher(nc)
	uc := usecase.NewAuthUseCase(userRepo, userCache, publisher, cfg.JWTSecret, cfg.JWTExpiryHours)
	grpcHandler := deliverygrpc.NewAuthHandler(uc)
	_ = grpcHandler

	httpHandler := authhttp.NewAuthHTTPHandler(uc)
	mux := http.NewServeMux()
	httpHandler.RegisterRoutes(mux)
	httpSrv := &http.Server{Addr: ":" + cfg.HTTPPort, Handler: mux}
	go func() {
		slog.Info("auth http server starting", "port", cfg.HTTPPort)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("http server error", "err", err)
		}
	}()

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		slog.Error("failed to bind port", "port", cfg.GRPCPort, "err", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(server.RecoveryInterceptor, server.LoggingInterceptor),
	)

	go func() {
		slog.Info("auth service starting", "port", cfg.GRPCPort)
		if err := grpcServer.Serve(lis); err != nil {
			slog.Error("grpc server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down auth service")
	grpcServer.GracefulStop()
}

func ensureSchema(ctx context.Context, db *pgxpool.Pool) error {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			username TEXT NOT NULL DEFAULT '',
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE IF NOT EXISTS wallets (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL UNIQUE,
			balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS wallet_transactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			type TEXT NOT NULL,
			amount_cents BIGINT NOT NULL,
			description TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created_at
		 ON wallet_transactions (user_id, created_at DESC)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(ctx, q); err != nil {
			return err
		}
	}

	return nil
}
