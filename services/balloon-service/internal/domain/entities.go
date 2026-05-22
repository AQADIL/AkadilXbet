package domain

import "time"

const (
	StatusIdle    = "idle"
	StatusActive  = "active"
	StatusWon     = "won"
	StatusPopped  = "popped"
	StatusAborted = "aborted"
)

type Session struct {
	ID                string
	UserID            string
	Status            string
	BetAmountCents    int64
	CurrentMultiplier float64
	PumpCount         int
	PayoutCents       int64
	StartedAt         time.Time
	EndedAt           *time.Time
}
