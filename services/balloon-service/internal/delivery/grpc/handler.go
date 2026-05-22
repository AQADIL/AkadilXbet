package grpc

import (
	"context"

	"github.com/akadilxbet/balloon-service/internal/domain"
	"github.com/akadilxbet/balloon-service/internal/pb"
	"github.com/akadilxbet/balloon-service/internal/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type BalloonHandler struct {
	pb.UnimplementedBalloonServiceServer
	uc *usecase.BalloonUseCase
}

func NewBalloonHandler(uc *usecase.BalloonUseCase) *BalloonHandler {
	return &BalloonHandler{uc: uc}
}

func (h *BalloonHandler) StartSession(ctx context.Context, req *pb.StartSessionRequest) (*pb.SessionResponse, error) {
	s, err := h.uc.StartSession(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return sessionPB(s), nil
}

func (h *BalloonHandler) PlaceBet(ctx context.Context, req *pb.PlaceBetRequest) (*pb.BetResponse, error) {
	s, bal, err := h.uc.PlaceBet(ctx, req.UserId, req.AmountCents)
	if err != nil {
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	}
	return &pb.BetResponse{
		SessionId: s.ID, UserId: s.UserID, AmountCents: s.BetAmountCents,
		BalanceCents: bal, Status: s.Status,
	}, nil
}

func (h *BalloonHandler) Pump(ctx context.Context, req *pb.PumpRequest) (*pb.PumpResponse, error) {
	s, popped, err := h.uc.Pump(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	}
	return &pb.PumpResponse{
		SessionId: s.ID, CurrentMultiplier: s.CurrentMultiplier,
		Popped: popped, Status: s.Status,
	}, nil
}

func (h *BalloonHandler) Release(ctx context.Context, req *pb.ReleaseRequest) (*pb.ReleaseResponse, error) {
	s, bal, err := h.uc.Release(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	}
	return &pb.ReleaseResponse{
		SessionId: s.ID, Multiplier: s.CurrentMultiplier,
		PayoutCents: s.PayoutCents, BalanceCents: bal, Popped: false,
	}, nil
}

func (h *BalloonHandler) GetActiveSession(ctx context.Context, req *pb.GetActiveSessionRequest) (*pb.SessionResponse, error) {
	s, err := h.uc.GetActiveSession(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return sessionPB(s), nil
}

func (h *BalloonHandler) AbortSession(ctx context.Context, req *pb.AbortSessionRequest) (*pb.SessionResponse, error) {
	s, err := h.uc.AbortSession(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	}
	return sessionPB(s), nil
}

func (h *BalloonHandler) GetSessionResult(ctx context.Context, req *pb.GetSessionResultRequest) (*pb.SessionResultResponse, error) {
	s, err := h.uc.GetSessionResult(ctx, req.SessionId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}
	return &pb.SessionResultResponse{
		SessionId: s.ID, Status: s.Status, Multiplier: s.CurrentMultiplier,
		PayoutCents: s.PayoutCents, Won: s.Status == domain.StatusWon,
	}, nil
}

func (h *BalloonHandler) GetHistory(ctx context.Context, req *pb.GetHistoryRequest) (*pb.HistoryResponse, error) {
	list, err := h.uc.GetHistory(ctx, req.UserId, int(req.Limit))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	entries := make([]*pb.HistoryEntry, len(list))
	for i, s := range list {
		entries[i] = &pb.HistoryEntry{
			SessionId: s.ID, Status: s.Status, Multiplier: s.CurrentMultiplier,
			PayoutCents: s.PayoutCents, CreatedAt: s.StartedAt.UnixMilli(),
		}
	}
	return &pb.HistoryResponse{Entries: entries}, nil
}

func (h *BalloonHandler) GetConfig(ctx context.Context, _ *pb.GetConfigRequest) (*pb.ConfigResponse, error) {
	cfg := h.uc.GetConfig()
	return &pb.ConfigResponse{
		MinBetCents: cfg.MinBetCents, MaxBetCents: cfg.MaxBetCents, PumpRate: 0.04,
	}, nil
}

func (h *BalloonHandler) ValidatePumpRate(ctx context.Context, req *pb.ValidatePumpRateRequest) (*pb.ValidatePumpRateResponse, error) {
	ok, reason := h.uc.ValidatePumpRate(req.UserId, req.IntervalMs)
	return &pb.ValidatePumpRateResponse{Allowed: ok, Reason: reason}, nil
}

func (h *BalloonHandler) GetPlayerStats(ctx context.Context, req *pb.GetPlayerStatsRequest) (*pb.PlayerStatsResponse, error) {
	s, w, wag, won, err := h.uc.GetPlayerStats(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.PlayerStatsResponse{
		TotalSessions: s, TotalWins: w, TotalWageredCents: wag, TotalWonCents: won,
	}, nil
}

func (h *BalloonHandler) StreamPumpTicks(_ *pb.StreamPumpRequest, _ pb.BalloonService_StreamPumpTicksServer) error {
	return status.Error(codes.Unimplemented, "use HTTP SSE")
}

func sessionPB(s *domain.Session) *pb.SessionResponse {
	return &pb.SessionResponse{
		SessionId: s.ID, Status: s.Status, CurrentMultiplier: s.CurrentMultiplier,
		BetAmountCents: s.BetAmountCents, StartedAt: s.StartedAt.UnixMilli(),
	}
}
