package repository

import (
	"context"

	"github.com/akadilxbet/auth-service/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, userID string) (*domain.User, error)
	UpdateUsername(ctx context.Context, userID, username string) (*domain.User, error)
	EnsureWallet(ctx context.Context, userID string, startingBalanceCents int64) error
	GetWallet(ctx context.Context, userID string) (*domain.Wallet, error)
	ListWalletTransactions(ctx context.Context, userID string, limit int) ([]domain.WalletTransaction, error)
}
