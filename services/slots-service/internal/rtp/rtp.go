package rtp

import (
	"math/rand"
	"sync/atomic"
)

// houseBank tracks the casino's profit pool in cents.
// Starts at 10_000_000 cents ($100k).
var houseBank atomic.Int64

func init() {
	houseBank.Store(10_000_000)
}

// Symbol indices match the frontend SYMBOLS array:
// 0=7(50x), 1=diamond(20x), 2=star(10x), 3=dollar(5x), 4=club(3x), 5=heart(2x)
var multipliers = []float64{50, 20, 10, 5, 3, 2}

type SlotsResult struct {
	Reels       [3]int
	Multiplier  float64
	PayoutCents int64
}

func CalculateSlots(betCents, playerBalanceCents int64) SlotsResult {
	bank := houseBank.Load()

	// Force loss if bet would over-expose house
	if betCents > bank/10 || bank < 500_000 {
		return buildLoss()
	}

	winChance := baseWinChance(playerBalanceCents)

	if rand.Float64() >= winChance {
		houseBank.Add(betCents)
		return buildLoss()
	}

	sym, mult := pickWinningSymbol()
	payout := int64(float64(betCents) * mult)
	houseBank.Add(betCents - payout)
	return SlotsResult{
		Reels:       [3]int{sym, sym, sym},
		Multiplier:  mult,
		PayoutCents: payout,
	}
}

// baseWinChance biases outcome based on player balance.
// Rich players win less (squeeze phase), poor players win more (retention hook).
func baseWinChance(balanceCents int64) float64 {
	switch {
	case balanceCents < 10_000: // < 100 credits
		return 0.45
	case balanceCents > 150_000: // > 1500 credits
		return 0.15
	default:
		return 0.30
	}
}

// pickWinningSymbol returns (symbolIndex, multiplier) heavily weighted toward low multipliers.
// Jackpot (7, 50x) is a 2% shot — rare enough to be exciting, not to bankrupt the house.
func pickWinningSymbol() (int, float64) {
	// Weights: 50x=2%, 20x=8%, 10x=10%, 5x=15%, 3x=25%, 2x=40%
	weights := []float64{0.02, 0.08, 0.10, 0.15, 0.25, 0.40}
	r := rand.Float64()
	cumulative := 0.0
	for i, w := range weights {
		cumulative += w
		if r < cumulative {
			return i, multipliers[i]
		}
	}
	return 5, multipliers[5]
}

func buildLoss() SlotsResult {
	// Generate 3 reels where not all symbols match
	reels := [3]int{rand.Intn(6), rand.Intn(6), rand.Intn(6)}
	// If accidental jackpot, break it
	if reels[0] == reels[1] && reels[1] == reels[2] {
		reels[2] = (reels[2] + 1 + rand.Intn(4)) % 6
	}
	return SlotsResult{Reels: reels, Multiplier: 0, PayoutCents: 0}
}
