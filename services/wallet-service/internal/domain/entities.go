package domain

import "time"

type User struct {
	ID        string
	Username  string
	Email     string
	CreatedAt time.Time
}

type Wallet struct {
	ID        string
	UserID    string
	Balance   int64
	UpdatedAt time.Time
}

type ErrInsufficientFunds struct{}

func (e ErrInsufficientFunds) Error() string {
	return "insufficient funds"
}

type ErrUserNotFound struct{}

func (e ErrUserNotFound) Error() string {
	return "user not found"
}
