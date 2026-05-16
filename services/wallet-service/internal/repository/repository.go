package repository

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
)

type UserRepository interface {
	GetByID(ctx context.Context, userID string) (*domain.User, error)
}

type WalletRepository interface {
	GetBalance(ctx context.Context, userID string) (int64, error)
	Deposit(ctx context.Context, userID string, amount int64) (int64, error)
	Deduct(ctx context.Context, userID string, amount int64) (int64, error)
}
