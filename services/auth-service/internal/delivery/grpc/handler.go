package grpc

import (
	"context"
	"errors"

	authpb "github.com/AQADIL/akadilxbet-protos/pb/auth"
	"github.com/akadilxbet/auth-service/internal/domain"
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

func (h *AuthHandler) Register(ctx context.Context, req *authpb.RegisterRequest) (*authpb.RegisterResponse, error) {
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

	return &authpb.RegisterResponse{UserId: userID, Token: token}, nil
}

func (h *AuthHandler) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
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

	return &authpb.LoginResponse{UserId: userID, Token: token}, nil
}

func (h *AuthHandler) GetUserProfile(ctx context.Context, req *authpb.GetUserProfileRequest) (*authpb.GetUserProfileResponse, error) {
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

	return &authpb.GetUserProfileResponse{
		UserId:    user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Unix(),
	}, nil
}
