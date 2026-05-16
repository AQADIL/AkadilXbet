package main

import (
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/game-engine-service/internal/config"
	deliverygrpc "github.com/akadilxbet/game-engine-service/internal/delivery/grpc"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		slog.Error("failed to bind port", "port", cfg.GRPCPort, "err", err)
		os.Exit(1)
	}

	grpcServer := grpc.NewServer()
	_ = deliverygrpc.NewGameEngineHandler()

	go func() {
		slog.Info("game engine starting", "port", cfg.GRPCPort)
		if err := grpcServer.Serve(lis); err != nil {
			slog.Error("grpc server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down game engine")
	grpcServer.GracefulStop()
}
