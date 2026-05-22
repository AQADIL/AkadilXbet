package grpc

import (
	"context"

	"github.com/akadilxbet/aviator-service/internal/domain"
	"github.com/akadilxbet/aviator-service/internal/pb"
	"github.com/akadilxbet/aviator-service/internal/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AviatorHandler struct {
	pb.UnimplementedAviatorServiceServer
	uc *usecase.AviatorUseCase
}

func NewAviatorHandler(uc *usecase.AviatorUseCase) *AviatorHandler {
	return &AviatorHandler{uc: uc}
}

func (h *AviatorHandler) GetCurrentRound(ctx context.Context, _ *pb.GetCurrentRoundRequest) (*pb.RoundResponse, error) {
	r, err := h.uc.GetCurrentRound(ctx)
	if err != nil {
		return nil, status.Error(codes.NotFound, "no active round")
	}
	return roundToPB(r), nil
}

func (h *AviatorHandler) StartRound(ctx context.Context, _ *pb.StartRoundRequest) (*pb.RoundResponse, error) {
	r, err := h.uc.GetCurrentRound(ctx)
	if err != nil {
		return nil, status.Error(codes.NotFound, "round engine starting")
	}
	return roundToPB(r), nil
}

func (h *AviatorHandler) PlaceBet(ctx context.Context, req *pb.PlaceBetRequest) (*pb.BetResponse, error) {
	if req.UserId == "" || req.AmountCents <= 0 {
		return nil, status.Error(codes.InvalidArgument, "invalid bet")
	}
	bet, bal, err := h.uc.PlaceBet(ctx, req.UserId, req.AmountCents)
	if err != nil {
		return nil, mapErr(err)
	}
	return &pb.BetResponse{
		BetId: bet.ID, RoundId: bet.RoundID, UserId: bet.UserID,
		AmountCents: bet.AmountCents, Status: bet.Status, BalanceCents: bal,
	}, nil
}

func (h *AviatorHandler) CashOut(ctx context.Context, req *pb.CashOutRequest) (*pb.CashOutResponse, error) {
	bet, bal, err := h.uc.CashOut(ctx, req.UserId, req.BetId, 0)
	if err != nil {
		return nil, mapErr(err)
	}
	return &pb.CashOutResponse{
		BetId: bet.ID, Multiplier: bet.CashoutMultiplier,
		PayoutCents: bet.PayoutCents, BalanceCents: bal,
	}, nil
}

func (h *AviatorHandler) SetAutoCashOut(ctx context.Context, req *pb.SetAutoCashOutRequest) (*pb.AutoCashOutResponse, error) {
	if err := h.uc.SetAutoCashOut(ctx, req.UserId, req.BetId, req.Multiplier); err != nil {
		return nil, mapErr(err)
	}
	return &pb.AutoCashOutResponse{BetId: req.BetId, Multiplier: req.Multiplier, Active: true}, nil
}

func (h *AviatorHandler) ClearAutoCashOut(ctx context.Context, req *pb.ClearAutoCashOutRequest) (*pb.AutoCashOutResponse, error) {
	if err := h.uc.ClearAutoCashOut(ctx, req.UserId, req.BetId); err != nil {
		return nil, mapErr(err)
	}
	return &pb.AutoCashOutResponse{BetId: req.BetId, Active: false}, nil
}

func (h *AviatorHandler) GetMyActiveBets(ctx context.Context, req *pb.GetMyActiveBetsRequest) (*pb.BetsListResponse, error) {
	bets, err := h.uc.GetMyActiveBets(ctx, req.UserId)
	if err != nil {
		return nil, mapErr(err)
	}
	return &pb.BetsListResponse{Bets: betsToPB(bets)}, nil
}

func (h *AviatorHandler) GetRoundHistory(ctx context.Context, req *pb.GetRoundHistoryRequest) (*pb.RoundHistoryResponse, error) {
	rounds, err := h.uc.GetRoundHistory(ctx, int(req.Limit))
	if err != nil {
		return nil, status.Error(codes.Internal, "history failed")
	}
	out := make([]*pb.RoundResponse, len(rounds))
	for i, r := range rounds {
		out[i] = roundToPB(r)
	}
	return &pb.RoundHistoryResponse{Rounds: out}, nil
}

func (h *AviatorHandler) GetRoundById(ctx context.Context, req *pb.GetRoundByIdRequest) (*pb.RoundResponse, error) {
	r, err := h.uc.GetRoundByID(ctx, req.RoundId)
	if err != nil {
		return nil, mapErr(err)
	}
	return roundToPB(r), nil
}

func (h *AviatorHandler) GetBetsByRound(ctx context.Context, req *pb.GetBetsByRoundRequest) (*pb.BetsListResponse, error) {
	bets, err := h.uc.GetBetsByRound(ctx, req.RoundId)
	if err != nil {
		return nil, mapErr(err)
	}
	return &pb.BetsListResponse{Bets: betsToPB(bets)}, nil
}

func (h *AviatorHandler) GetPlayerStats(ctx context.Context, req *pb.GetPlayerStatsRequest) (*pb.PlayerStatsResponse, error) {
	b, w, wag, won, err := h.uc.GetPlayerStats(ctx, req.UserId)
	if err != nil {
		return nil, status.Error(codes.Internal, "stats failed")
	}
	return &pb.PlayerStatsResponse{
		TotalBets: b, TotalWins: w, TotalWageredCents: wag, TotalWonCents: won,
	}, nil
}

func (h *AviatorHandler) StreamRoundUpdates(req *pb.StreamRoundRequest, stream pb.AviatorService_StreamRoundUpdatesServer) error {
	ch := h.uc.Subscribe()
	for r := range ch {
		_ = stream.Send(&pb.RoundTick{
			RoundId: r.ID, Status: r.Status,
			CurrentMultiplier: r.CurrentMultiplier,
			ServerTime:        r.StartedAt.UnixMilli(),
		})
	}
	return nil
}

func roundToPB(r *domain.Round) *pb.RoundResponse {
	var crashed int64
	if r.CrashedAt != nil {
		crashed = r.CrashedAt.UnixMilli()
	}
	return &pb.RoundResponse{
		RoundId: r.ID, Status: r.Status,
		CurrentMultiplier: r.CurrentMultiplier,
		CrashMultiplier:   r.CrashMultiplier,
		StartedAt:         r.StartedAt.UnixMilli(),
		CrashedAt:         crashed,
	}
}

func betsToPB(bets []*domain.Bet) []*pb.BetEntry {
	out := make([]*pb.BetEntry, len(bets))
	for i, b := range bets {
		out[i] = &pb.BetEntry{
			BetId: b.ID, UserId: b.UserID, AmountCents: b.AmountCents,
			Status: b.Status, CashoutMultiplier: b.CashoutMultiplier, PayoutCents: b.PayoutCents,
		}
	}
	return out
}

func mapErr(err error) error {
	switch err {
	case domain.ErrBetClosed, domain.ErrInvalidPhase:
		return status.Error(codes.FailedPrecondition, err.Error())
	case domain.ErrInsufficientFunds:
		return status.Error(codes.FailedPrecondition, err.Error())
	case domain.ErrBetNotFound, domain.ErrRoundNotFound:
		return status.Error(codes.NotFound, err.Error())
	case domain.ErrUnauthorizedBet:
		return status.Error(codes.PermissionDenied, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}
