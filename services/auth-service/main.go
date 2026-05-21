package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/auth-service/internal/cache"
	"github.com/akadilxbet/auth-service/internal/config"
	deliverygrpc "github.com/akadilxbet/auth-service/internal/delivery/grpc"
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
	handler := deliverygrpc.NewAuthHandler(uc)
	_ = handler

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
