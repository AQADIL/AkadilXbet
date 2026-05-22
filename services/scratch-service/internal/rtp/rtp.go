package rtp

import (
	"math/rand"
	"sync/atomic"
)

// houseBank tracks the casino's profit pool in cents.
// Starts at 10_000_000 cents ($100k). Grows on player loss, shrinks on win.
var houseBank atomic.Int64

func init() {
	houseBank.Store(10_000_000)
}

// Symbol indices match the frontend SYMBOLS array (0=diamond 10x, 1=seven 8x, 2=star 5x, 3=dollar 3x, 4=club 2x, 5=heart 1.5x)
var multipliers = []float64{10, 8, 5, 3, 2, 1.5}

// winLines: all valid 3-of-a-kind positions in the 3x3 grid
var winLines = [][]int{
	{0, 1, 2}, {3, 4, 5}, {6, 7, 8}, // rows
	{0, 3, 6}, {1, 4, 7}, {2, 5, 8}, // cols
	{0, 4, 8}, {2, 4, 6},             // diags
}

type ScratchResult struct {
	Symbols       []int
	WinLine       []int
	WinMultiplier float64
	PayoutCents   int64
}

func CalculateScratch(betCents, playerBalanceCents int64) ScratchResult {
	bank := houseBank.Load()

	// Force loss if the bet would bankrupt the house
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
	return buildWin(sym, mult, payout)
}

// baseWinChance returns win probability based on player's current balance.
// Rich players win less (house squeezes), poor players win more (engagement bait).
func baseWinChance(balanceCents int64) float64 {
	switch {
	case balanceCents < 10_000: // < 100 credits
		return 0.50
	case balanceCents > 150_000: // > 1500 credits
		return 0.20
	default:
		return 0.35
	}
}

// pickWinningSymbol returns (symbolIndex, multiplier) weighted toward low multipliers.
func pickWinningSymbol() (int, float64) {
	// Weights: 1.5x=40%, 2x=25%, 3x=20%, 5x=10%, 8x=4%, 10x=1%
	weights := []float64{0.01, 0.04, 0.10, 0.20, 0.25, 0.40}
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

func buildWin(sym int, mult float64, payoutCents int64) ScratchResult {
	symbols := make([]int, 9)
	// Pick a random win line and place winning symbol there
	line := winLines[rand.Intn(len(winLines))]
	for _, pos := range line {
		symbols[pos] = sym
	}
	// Fill remaining positions with random symbols, avoiding accidental wins
	lineSet := make(map[int]bool, 3)
	for _, p := range line {
		lineSet[p] = true
	}
	for i := range symbols {
		if lineSet[i] {
			continue
		}
		symbols[i] = randomSymbolExcept(sym)
	}
	// Quick check: fix any accidental additional win lines
	fixAccidentalWins(symbols, line)

	return ScratchResult{
		Symbols:       symbols,
		WinLine:       line,
		WinMultiplier: mult,
		PayoutCents:   payoutCents,
	}
}

func buildLoss() ScratchResult {
	symbols := make([]int, 9)
	for i := range symbols {
		symbols[i] = rand.Intn(6)
	}
	// Ensure no 3-of-a-kind on any line
	for _, line := range winLines {
		if symbols[line[0]] == symbols[line[1]] && symbols[line[1]] == symbols[line[2]] {
			// Break the match by changing the middle element
			symbols[line[1]] = (symbols[line[1]] + 1 + rand.Intn(4)) % 6
		}
	}
	return ScratchResult{Symbols: symbols, WinLine: nil, WinMultiplier: 0, PayoutCents: 0}
}

func randomSymbolExcept(exclude int) int {
	s := rand.Intn(5)
	if s >= exclude {
		s++
	}
	return s
}

// fixAccidentalWins ensures only the intended win line is a match.
func fixAccidentalWins(symbols []int, intendedLine []int) {
	intended := make(map[int]bool, 3)
	for _, p := range intendedLine {
		intended[p] = true
	}
	for _, line := range winLines {
		if lineEquals(line, intendedLine) {
			continue
		}
		if symbols[line[0]] == symbols[line[1]] && symbols[line[1]] == symbols[line[2]] {
			// Break by changing a non-intended position in this line
			for _, pos := range line {
				if !intended[pos] {
					symbols[pos] = randomSymbolExcept(symbols[line[0]])
					break
				}
			}
		}
	}
}

func lineEquals(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
