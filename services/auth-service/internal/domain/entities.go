package domain

import "time"

type User struct {
	ID           string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

type ErrUserNotFound struct{}

func (e ErrUserNotFound) Error() string { return "user not found" }

type ErrEmailTaken struct{}

func (e ErrEmailTaken) Error() string { return "email already registered" }

type ErrInvalidCredentials struct{}

func (e ErrInvalidCredentials) Error() string { return "invalid email or password" }
