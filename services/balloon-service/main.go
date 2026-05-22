package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/balloon-service/internal/client"
	"github.com/akadilxbet/balloon-service/internal/config"
	deliverygrpc "github.com/akadilxbet/balloon-service/internal/delivery/grpc"
	deliveryhttp "github.com/akadilxbet/balloon-service/internal/delivery/http"
	"github.com/akadilxbet/balloon-service/internal/messaging"
	"github.com/akadilxbet/balloon-service/internal/pb"
	"github.com/akadilxbet/balloon-service/internal/repository/postgres"
	"github.com/akadilxbet/balloon-service/internal/usecase"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	ctx := context.Background()
	db, err := pgxpool.New(ctx, cfg.PostgresDSN)
	if err != nil {
		slog.Error("postgres failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer rdb.Close()

	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		slog.Error("nats failed", "err", err)
		os.Exit(1)
	}
	defer nc.Drain()

	sessionRepo := postgres.NewSessionRepo(db)
	balance := client.NewBalanceStore(rdb)
	publisher := messaging.NewPublisher(nc)
	uc := usecase.NewBalloonUseCase(sessionRepo, balance, publisher, cfg)

	grpcHandler := deliverygrpc.NewBalloonHandler(uc)
	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		os.Exit(1)
	}
	grpcServer := grpc.NewServer()
	pb.RegisterBalloonServiceServer(grpcServer, grpcHandler)

	mux := http.NewServeMux()
	deliveryhttp.NewHandler(uc, balance).Register(mux)
	httpSrv := &http.Server{Addr: ":" + cfg.HTTPPort, Handler: mux}

	go func() {
		slog.Info("balloon grpc", "port", cfg.GRPCPort)
		_ = grpcServer.Serve(lis)
	}()
	go func() {
		slog.Info("balloon http", "port", cfg.HTTPPort)
		_ = httpSrv.ListenAndServe()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	grpcServer.GracefulStop()
	_ = httpSrv.Shutdown(context.Background())
}
