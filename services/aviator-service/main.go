package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/akadilxbet/aviator-service/internal/client"
	"github.com/akadilxbet/aviator-service/internal/config"
	deliverygrpc "github.com/akadilxbet/aviator-service/internal/delivery/grpc"
	deliveryhttp "github.com/akadilxbet/aviator-service/internal/delivery/http"
	"github.com/akadilxbet/aviator-service/internal/messaging"
	"github.com/akadilxbet/aviator-service/internal/pb"
	"github.com/akadilxbet/aviator-service/internal/repository/postgres"
	redisrepo "github.com/akadilxbet/aviator-service/internal/repository/redis"
	"github.com/akadilxbet/aviator-service/internal/usecase"
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
		slog.Error("postgres connect failed", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer rdb.Close()

	nc, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		slog.Error("nats connect failed", "err", err)
		os.Exit(1)
	}
	defer nc.Drain()

	roundRepo := postgres.NewRoundRepo(db)
	betRepo := postgres.NewBetRepo(db)
	roundCache := redisrepo.NewRoundCache(rdb)
	balance := client.NewBalanceStore(rdb)
	publisher := messaging.NewPublisher(nc)
	uc := usecase.NewAviatorUseCase(roundRepo, betRepo, roundCache, balance, publisher, cfg)
	uc.StartEngine(ctx)

	grpcHandler := deliverygrpc.NewAviatorHandler(uc)
	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		slog.Error("grpc bind failed", "err", err)
		os.Exit(1)
	}
	grpcServer := grpc.NewServer()
	pb.RegisterAviatorServiceServer(grpcServer, grpcHandler)

	httpMux := http.NewServeMux()
	deliveryhttp.NewHandler(uc, balance).Register(httpMux)
	httpSrv := &http.Server{Addr: ":" + cfg.HTTPPort, Handler: httpMux}

	go func() {
		slog.Info("aviator grpc starting", "port", cfg.GRPCPort)
		if err := grpcServer.Serve(lis); err != nil {
			slog.Error("grpc error", "err", err)
			os.Exit(1)
		}
	}()
	go func() {
		slog.Info("aviator http starting", "port", cfg.HTTPPort)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("http error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down aviator")
	grpcServer.GracefulStop()
	_ = httpSrv.Shutdown(context.Background())
}
