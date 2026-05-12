package server

import (
	"context"
	"log/slog"
	"runtime/debug"
	"time"

	"github.com/akadilxbet/auth-service/internal/config"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func RegisterHandlers(s *grpc.Server, cfg *config.Config) {
}

func RecoveryInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (resp any, err error) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("panic recovered", "method", info.FullMethod, "panic", r, "stack", string(debug.Stack()))
			err = status.Errorf(codes.Internal, "internal server error")
		}
	}()
	return handler(ctx, req)
}

func LoggingInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	start := time.Now()
	resp, err := handler(ctx, req)
	slog.Info("grpc call",
		"method", info.FullMethod,
		"duration_ms", time.Since(start).Milliseconds(),
		"error", err,
	)
	return resp, err
}
