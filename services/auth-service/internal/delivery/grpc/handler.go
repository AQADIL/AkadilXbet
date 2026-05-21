package grpc

import (
	"context"
	"errors"

	"github.com/akadilxbet/auth-service/internal/domain"
	"github.com/akadilxbet/auth-service/internal/pb"
	"github.com/akadilxbet/auth-service/internal/usecase"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthHandler struct {
	uc *usecase.AuthUseCase
}

func NewAuthHandler(uc *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

func (h *AuthHandler) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password are required")
	}

	userID, token, err := h.uc.Register(ctx, req.Email, req.Password)
	if err != nil {
		if errors.As(err, &domain.ErrEmailTaken{}) {
			return nil, status.Error(codes.AlreadyExists, "email already registered")
		}
		return nil, status.Error(codes.Internal, "registration failed")
	}

	return &pb.RegisterResponse{UserId: userID, Token: token}, nil
}

func (h *AuthHandler) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password are required")
	}

	userID, token, err := h.uc.Login(ctx, req.Email, req.Password)
	if err != nil {
		if errors.As(err, &domain.ErrInvalidCredentials{}) {
			return nil, status.Error(codes.Unauthenticated, "invalid credentials")
		}
		return nil, status.Error(codes.Internal, "login failed")
	}

	return &pb.LoginResponse{UserId: userID, Token: token}, nil
}

func (h *AuthHandler) GetUserProfile(ctx context.Context, req *pb.GetUserProfileRequest) (*pb.GetUserProfileResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	user, err := h.uc.GetUserProfile(ctx, req.UserId)
	if err != nil {
		if errors.As(err, &domain.ErrUserNotFound{}) {
			return nil, status.Error(codes.NotFound, "user not found")
		}
		return nil, status.Error(codes.Internal, "failed to get profile")
	}

	return &pb.GetUserProfileResponse{
		UserId:    user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Unix(),
	}, nil
}
