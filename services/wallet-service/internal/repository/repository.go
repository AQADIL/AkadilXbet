package repository

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
)

type WalletRepository interface {
	Create(ctx context.Context, userID string, startingBalanceCents int64) (*domain.Wallet, error)
	GetByUserID(ctx context.Context, userID string) (*domain.Wallet, error)
	Deposit(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error)
	Deduct(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error)
}
