package domain

import "errors"

var (
	ErrRoundNotFound      = errors.New("round not found")
	ErrBetNotFound        = errors.New("bet not found")
	ErrInvalidPhase       = errors.New("invalid round phase")
	ErrBetClosed          = errors.New("betting closed")
	ErrInsufficientFunds  = errors.New("insufficient funds")
	ErrUnauthorizedBet    = errors.New("bet does not belong to user")
)

type InsufficientFundsError struct{ Err error }

func (e InsufficientFundsError) Error() string { return ErrInsufficientFunds.Error() }
