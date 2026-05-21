package repository

import (
	"context"

	"github.com/akadilxbet/auth-service/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, userID string) (*domain.User, error)
}
