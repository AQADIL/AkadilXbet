package domain

import "time"

const (
	RoundWaiting = "waiting"
	RoundFlying  = "flying"
	RoundCrashed = "crashed"

	BetPending  = "pending"
	BetActive   = "active"
	BetCashed   = "cashed_out"
	BetLost     = "lost"
	BetCanceled = "canceled"
)

type Round struct {
	ID                 string
	Status             string
	CurrentMultiplier  float64
	CrashMultiplier    float64
	StartedAt          time.Time
	CrashedAt          *time.Time
	TotalBetCents      int64
}

type Bet struct {
	ID                 string
	RoundID            string
	UserID             string
	AmountCents        int64
	Status             string
	AutoCashoutMult    float64
	CashoutMultiplier  float64
	PayoutCents        int64
}
