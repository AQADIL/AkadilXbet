package domain

import "time"

type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

type Wallet struct {
	UserID       string
	BalanceCents int64
	UpdatedAt    time.Time
}

type WalletTransaction struct {
	ID          string
	UserID      string
	Type        string
	AmountCents int64
	Description string
	CreatedAt   time.Time
}

type ErrUserNotFound struct{}

func (e ErrUserNotFound) Error() string { return "user not found" }

type ErrEmailTaken struct{}

func (e ErrEmailTaken) Error() string { return "email already registered" }

type ErrInvalidCredentials struct{}

func (e ErrInvalidCredentials) Error() string { return "invalid email or password" }

type ErrUnauthorized struct{}

func (e ErrUnauthorized) Error() string { return "unauthorized" }

type ErrWalletNotFound struct{}

func (e ErrWalletNotFound) Error() string { return "wallet not found" }
