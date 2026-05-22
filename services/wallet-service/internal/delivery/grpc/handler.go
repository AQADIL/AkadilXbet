package grpc

import (
	"context"
	"errors"

	walletpb "github.com/AQADIL/akadilxbet-protos/pb/wallet"
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

func (h *WalletHandler) GetBalance(ctx context.Context, req *walletpb.GetBalanceRequest) (*walletpb.GetBalanceResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	wallet, err := h.uc.GetBalance(ctx, req.UserId)
	if err != nil {
		if errors.As(err, &domain.ErrWalletNotFound{}) {
			return nil, status.Error(codes.NotFound, "wallet not found")
		}
		return nil, status.Error(codes.Internal, "failed to get balance")
	}
	return &walletpb.GetBalanceResponse{UserId: wallet.UserID, Balance: wallet.BalanceCents}, nil
}

func (h *WalletHandler) Deposit(ctx context.Context, req *walletpb.DepositRequest) (*walletpb.BalanceResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	wallet, err := h.uc.Deposit(ctx, req.UserId, req.Amount)
	if err != nil {
		if errors.As(err, &domain.ErrWalletNotFound{}) {
			return nil, status.Error(codes.NotFound, "wallet not found")
		}
		return nil, status.Error(codes.Internal, "deposit failed")
	}
	return &walletpb.BalanceResponse{UserId: wallet.UserID, NewBalance: wallet.BalanceCents}, nil
}

func (h *WalletHandler) Deduct(ctx context.Context, req *walletpb.DeductRequest) (*walletpb.BalanceResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	wallet, err := h.uc.Deduct(ctx, req.UserId, req.Amount)
	if err != nil {
		if errors.As(err, &domain.ErrInsufficientFunds{}) {
			return nil, status.Error(codes.FailedPrecondition, "insufficient funds")
		}
		if errors.As(err, &domain.ErrWalletNotFound{}) {
			return nil, status.Error(codes.NotFound, "wallet not found")
		}
		return nil, status.Error(codes.Internal, "deduct failed")
	}
	return &walletpb.BalanceResponse{UserId: wallet.UserID, NewBalance: wallet.BalanceCents}, nil
}
