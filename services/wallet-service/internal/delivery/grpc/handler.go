package grpc

import (
	"context"
	"errors"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/akadilxbet/wallet-service/internal/pb"
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

func (h *WalletHandler) GetBalance(ctx context.Context, req *pb.GetBalanceRequest) (*pb.GetBalanceResponse, error) {
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
	return &pb.GetBalanceResponse{UserId: wallet.UserID, BalanceCents: wallet.BalanceCents}, nil
}

func (h *WalletHandler) Deposit(ctx context.Context, req *pb.DepositRequest) (*pb.BalanceResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.AmountCents <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount_cents must be positive")
	}
	wallet, err := h.uc.Deposit(ctx, req.UserId, req.AmountCents)
	if err != nil {
		if errors.As(err, &domain.ErrWalletNotFound{}) {
			return nil, status.Error(codes.NotFound, "wallet not found")
		}
		return nil, status.Error(codes.Internal, "deposit failed")
	}
	return &pb.BalanceResponse{UserId: wallet.UserID, BalanceCents: wallet.BalanceCents}, nil
}

func (h *WalletHandler) Deduct(ctx context.Context, req *pb.DeductRequest) (*pb.BalanceResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.AmountCents <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount_cents must be positive")
	}
	wallet, err := h.uc.Deduct(ctx, req.UserId, req.AmountCents)
	if err != nil {
		if errors.As(err, &domain.ErrInsufficientFunds{}) {
			return nil, status.Error(codes.FailedPrecondition, "insufficient funds")
		}
		if errors.As(err, &domain.ErrWalletNotFound{}) {
			return nil, status.Error(codes.NotFound, "wallet not found")
		}
		return nil, status.Error(codes.Internal, "deduct failed")
	}
	return &pb.BalanceResponse{UserId: wallet.UserID, BalanceCents: wallet.BalanceCents}, nil
}
