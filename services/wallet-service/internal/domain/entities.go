package domain

import "time"

type Wallet struct {
	ID           string
	UserID       string
	BalanceCents int64
	UpdatedAt    time.Time
}

type ErrInsufficientFunds struct{}

func (e ErrInsufficientFunds) Error() string { return "insufficient funds" }

type ErrWalletNotFound struct{}

func (e ErrWalletNotFound) Error() string { return "wallet not found" }

type ErrWalletAlreadyExists struct{}

func (e ErrWalletAlreadyExists) Error() string { return "wallet already exists for this user" }
