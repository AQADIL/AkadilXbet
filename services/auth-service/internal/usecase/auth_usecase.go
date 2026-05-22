package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/akadilxbet/auth-service/internal/cache"
	"github.com/akadilxbet/auth-service/internal/domain"
	"github.com/akadilxbet/auth-service/internal/events"
	"github.com/akadilxbet/auth-service/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthUseCase struct {
	users     repository.UserRepository
	cache     *cache.UserCache
	publisher *events.Publisher
	jwtSecret []byte
	jwtExpiry time.Duration
}

func NewAuthUseCase(
	users repository.UserRepository,
	cache *cache.UserCache,
	publisher *events.Publisher,
	jwtSecret string,
	jwtExpiryHours int,
) *AuthUseCase {
	return &AuthUseCase{
		users:     users,
		cache:     cache,
		publisher: publisher,
		jwtSecret: []byte(jwtSecret),
		jwtExpiry: time.Duration(jwtExpiryHours) * time.Hour,
	}
}

func (uc *AuthUseCase) Register(ctx context.Context, email, password string) (string, string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}

	user, err := uc.users.Create(ctx, email, string(hash))
	if err != nil {
		return "", "", err
	}

	if err := uc.users.EnsureWallet(ctx, user.ID, 100000); err != nil {
		return "", "", err
	}

	token, err := uc.mintToken(user.ID)
	if err != nil {
		return "", "", err
	}

	_ = uc.publisher.PublishUserCreated(user.ID, user.Email)

	return user.ID, token, nil
}

func (uc *AuthUseCase) Login(ctx context.Context, email, password string) (string, string, error) {
	user, err := uc.users.GetByEmail(ctx, email)
	if err != nil {
		if errors.As(err, &domain.ErrUserNotFound{}) {
			return "", "", domain.ErrInvalidCredentials{}
		}
		return "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", domain.ErrInvalidCredentials{}
	}

	token, err := uc.mintToken(user.ID)
	if err != nil {
		return "", "", err
	}

	return user.ID, token, nil
}

func (uc *AuthUseCase) GetUserProfile(ctx context.Context, userID string) (*domain.User, error) {
	cached, err := uc.cache.GetProfile(ctx, userID)
	if err == nil {
		return cached, nil
	}

	user, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	_ = uc.cache.SetProfile(ctx, user)

	return user, nil
}

func (uc *AuthUseCase) UpdateUsername(ctx context.Context, userID, username string) (*domain.User, error) {
	user, err := uc.users.UpdateUsername(ctx, userID, username)
	if err != nil {
		return nil, err
	}
	_ = uc.cache.SetProfile(ctx, user)
	return user, nil
}

func (uc *AuthUseCase) GetWallet(ctx context.Context, userID string) (*domain.Wallet, error) {
	return uc.users.GetWallet(ctx, userID)
}

func (uc *AuthUseCase) ListWalletTransactions(ctx context.Context, userID string, limit int) ([]domain.WalletTransaction, error) {
	return uc.users.ListWalletTransactions(ctx, userID, limit)
}

func (uc *AuthUseCase) VerifyToken(token string) (string, error) {
	if token == "" {
		return "", domain.ErrUnauthorized{}
	}

	claims := &jwt.RegisteredClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, domain.ErrUnauthorized{}
		}
		return uc.jwtSecret, nil
	})
	if err != nil || !parsed.Valid || claims.Subject == "" {
		return "", domain.ErrUnauthorized{}
	}

	return claims.Subject, nil
}

func (uc *AuthUseCase) mintToken(userID string) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(uc.jwtExpiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(uc.jwtSecret)
}
