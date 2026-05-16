package rtp

import (
	"math/rand"
	"sync/atomic"
)

var fairGames = map[string]bool{
	"blackjack": true,
	"dice":      true,
	"247":       true,
}

var managedGames = map[string]bool{
	"aviator": true,
	"mines":   true,
	"slots":   true,
}

var mockCompanyBalance atomic.Int64

func init() {
	mockCompanyBalance.Store(1_000_000)
}

type OutcomeResult struct {
	PlayerWins bool
	Payout     int64
	Reason     string
}

func CalculateOutcome(gameType string, betAmount int64) OutcomeResult {
	if fairGames[gameType] {
		return OutcomeResult{
			PlayerWins: true,
			Payout:     betAmount,
			Reason:     "transparent video-based outcome",
		}
	}

	if managedGames[gameType] {
		return managedOutcome(betAmount)
	}

	return randomOutcome(betAmount)
}

func managedOutcome(betAmount int64) OutcomeResult {
	balance := mockCompanyBalance.Load()
	threshold := balance / 10

	if betAmount >= threshold {
		return OutcomeResult{
			PlayerWins: false,
			Payout:     0,
			Reason:     "house edge enforced",
		}
	}

	if rand.Float64() < 0.45 {
		payout := betAmount * 2
		mockCompanyBalance.Add(-betAmount)
		return OutcomeResult{
			PlayerWins: true,
			Payout:     payout,
			Reason:     "player win within safe threshold",
		}
	}

	mockCompanyBalance.Add(betAmount)
	return OutcomeResult{
		PlayerWins: false,
		Payout:     0,
		Reason:     "house wins",
	}
}

func randomOutcome(betAmount int64) OutcomeResult {
	if rand.Float64() < 0.5 {
		return OutcomeResult{PlayerWins: true, Payout: betAmount * 2, Reason: "random win"}
	}
	return OutcomeResult{PlayerWins: false, Payout: 0, Reason: "random loss"}
}
