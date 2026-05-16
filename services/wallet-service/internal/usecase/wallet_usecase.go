package usecase

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/akadilxbet/wallet-service/internal/repository"
)

type WalletUseCase struct {
	users   repository.UserRepository
	wallets repository.WalletRepository
}

func NewWalletUseCase(users repository.UserRepository, wallets repository.WalletRepository) *WalletUseCase {
	return &WalletUseCase{users: users, wallets: wallets}
}

func (uc *WalletUseCase) GetProfile(ctx context.Context, userID string) (*domain.User, int64, error) {
	user, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	balance, err := uc.wallets.GetBalance(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	return user, balance, nil
}

func (uc *WalletUseCase) GetBalance(ctx context.Context, userID string) (int64, error) {
	return uc.wallets.GetBalance(ctx, userID)
}

func (uc *WalletUseCase) Deposit(ctx context.Context, userID string, amount int64) (int64, error) {
	return uc.wallets.Deposit(ctx, userID, amount)
}

func (uc *WalletUseCase) Deduct(ctx context.Context, userID string, amount int64) (int64, error) {
	return uc.wallets.Deduct(ctx, userID, amount)
}
