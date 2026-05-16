package grpc

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/akadilxbet/wallet-service/internal/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type WalletHandler struct {
	uc *usecase.WalletUseCase
}

func NewWalletHandler(uc *usecase.WalletUseCase) *WalletHandler {
	return &WalletHandler{uc: uc}
}

func (h *WalletHandler) GetProfile(ctx context.Context, userID string) (*domain.User, int64, error) {
	user, balance, err := h.uc.GetProfile(ctx, userID)
	if err != nil {
		switch err.(type) {
		case domain.ErrUserNotFound:
			return nil, 0, status.Error(codes.NotFound, "user not found")
		default:
			return nil, 0, status.Error(codes.Internal, "internal error")
		}
	}
	return user, balance, nil
}

func (h *WalletHandler) GetBalance(ctx context.Context, userID string) (int64, error) {
	balance, err := h.uc.GetBalance(ctx, userID)
	if err != nil {
		return 0, status.Error(codes.Internal, "internal error")
	}
	return balance, nil
}

func (h *WalletHandler) Deposit(ctx context.Context, userID string, amount int64) (int64, error) {
	if amount <= 0 {
		return 0, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	newBalance, err := h.uc.Deposit(ctx, userID, amount)
	if err != nil {
		return 0, status.Error(codes.Internal, "deposit failed")
	}
	return newBalance, nil
}

func (h *WalletHandler) Deduct(ctx context.Context, userID string, amount int64) (int64, error) {
	if amount <= 0 {
		return 0, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	newBalance, err := h.uc.Deduct(ctx, userID, amount)
	if err != nil {
		switch err.(type) {
		case domain.ErrInsufficientFunds:
			return 0, status.Error(codes.FailedPrecondition, "insufficient funds")
		default:
			return 0, status.Error(codes.Internal, "deduct failed")
		}
	}
	return newBalance, nil
}
