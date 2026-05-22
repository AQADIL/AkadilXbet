package repository

import (
	"context"

	"github.com/akadilxbet/aviator-service/internal/domain"
)

type RoundRepository interface {
	Create(ctx context.Context, r *domain.Round) error
	Update(ctx context.Context, r *domain.Round) error
	GetByID(ctx context.Context, id string) (*domain.Round, error)
	GetLatest(ctx context.Context) (*domain.Round, error)
	ListHistory(ctx context.Context, limit int) ([]*domain.Round, error)
}

type BetRepository interface {
	Create(ctx context.Context, b *domain.Bet) error
	Update(ctx context.Context, b *domain.Bet) error
	GetByID(ctx context.Context, id string) (*domain.Bet, error)
	ListByRound(ctx context.Context, roundID string) ([]*domain.Bet, error)
	ListActiveByUserRound(ctx context.Context, userID, roundID string) ([]*domain.Bet, error)
	ListActiveByRound(ctx context.Context, roundID string) ([]*domain.Bet, error)
	PlayerStats(ctx context.Context, userID string) (bets, wins int32, wagered, won int64, err error)
}

type RoundCache interface {
	SetCurrent(ctx context.Context, r *domain.Round) error
	GetCurrent(ctx context.Context) (*domain.Round, error)
}
