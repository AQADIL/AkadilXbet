package main

import (
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/auth-service/internal/config"
	"github.com/akadilxbet/auth-service/internal/server"
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

	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(server.RecoveryInterceptor, server.LoggingInterceptor),
	)

	server.RegisterHandlers(grpcServer, cfg)

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
