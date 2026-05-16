package grpc

import (
	"context"

	"github.com/akadilxbet/game-engine-service/internal/rtp"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GameEngineHandler struct{}

func NewGameEngineHandler() *GameEngineHandler {
	return &GameEngineHandler{}
}

type OutcomeRequest struct {
	GameType  string
	BetAmount int64
	PlayerID  string
}

type OutcomeResponse struct {
	PlayerWins bool
	Payout     int64
	Reason     string
}

func (h *GameEngineHandler) CalculateOutcome(ctx context.Context, req *OutcomeRequest) (*OutcomeResponse, error) {
	if req.GameType == "" {
		return nil, status.Error(codes.InvalidArgument, "game_type is required")
	}
	if req.BetAmount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "bet_amount must be positive")
	}

	result := rtp.CalculateOutcome(req.GameType, req.BetAmount)

	return &OutcomeResponse{
		PlayerWins: result.PlayerWins,
		Payout:     result.Payout,
		Reason:     result.Reason,
	}, nil
}
