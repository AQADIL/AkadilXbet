package usecase

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/akadilxbet/wallet-service/internal/repository"
)

type WalletUseCase struct {
	wallets repository.WalletRepository
}

func NewWalletUseCase(wallets repository.WalletRepository) *WalletUseCase {
	return &WalletUseCase{wallets: wallets}
}

func (uc *WalletUseCase) CreateWallet(ctx context.Context, userID string, startingBalanceCents int64) (*domain.Wallet, error) {
	return uc.wallets.Create(ctx, userID, startingBalanceCents)
}

func (uc *WalletUseCase) GetBalance(ctx context.Context, userID string) (*domain.Wallet, error) {
	return uc.wallets.GetByUserID(ctx, userID)
}

func (uc *WalletUseCase) Deposit(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error) {
	return uc.wallets.Deposit(ctx, userID, amountCents)
}

func (uc *WalletUseCase) Deduct(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error) {
	return uc.wallets.Deduct(ctx, userID, amountCents)
}
