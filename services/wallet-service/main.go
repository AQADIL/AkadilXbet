package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/wallet-service/internal/config"
	deliverygrpc "github.com/akadilxbet/wallet-service/internal/delivery/grpc"
	"github.com/akadilxbet/wallet-service/internal/repository/postgres"
	"github.com/akadilxbet/wallet-service/internal/usecase"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		slog.Error("failed to connect to postgres", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	userRepo := postgres.NewUserRepo(pool)
	walletRepo := postgres.NewWalletRepo(pool)
	uc := usecase.NewWalletUseCase(userRepo, walletRepo)
	_ = deliverygrpc.NewWalletHandler(uc)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		slog.Error("failed to bind port", "port", cfg.GRPCPort, "err", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()

	go func() {
		slog.Info("wallet service starting", "port", cfg.GRPCPort)
		if err := grpcServer.Serve(lis); err != nil {
			slog.Error("grpc server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down wallet service")
	grpcServer.GracefulStop()
}
