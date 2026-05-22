package bankrtp

import (
	"crypto/rand"
	"encoding/binary"
	"math"
	"sync/atomic"
)

var houseBalance atomic.Int64

func init() {
	houseBalance.Store(1_000_000_00) // cents
}

type CrashPoint struct {
	Multiplier   float64
	ForceMinimum bool
	Reason       string
}

func GetHouseBalance() int64 {
	return houseBalance.Load()
}

func RecordDelta(deltaCents int64) int64 {
	return houseBalance.Add(deltaCents)
}

func GetCrashPoint(betTotalCents int64) CrashPoint {
	balance := houseBalance.Load()
	if balance <= 0 {
		return CrashPoint{Multiplier: 1.0, ForceMinimum: true, Reason: "bank empty"}
	}
	threshold := balance / 10
	if betTotalCents >= threshold {
		return CrashPoint{
			Multiplier:   1.0 + randomUnit()*0.12,
			ForceMinimum: true,
			Reason:       "high exposure",
		}
	}
	bankFactor := math.Min(1.0, float64(balance)/float64(500_000_00))
	if randomUnit() < 0.35+bankFactor*0.25 {
		mult := 1.15 + randomUnit()*3.5*bankFactor
		return CrashPoint{Multiplier: round2(mult), Reason: "friendly"}
	}
	mult := 1.0 + randomUnit()*2.2*(1-bankFactor*0.4)
	return CrashPoint{Multiplier: round2(mult), ForceMinimum: mult <= 1.02, Reason: "retention"}
}

func ShouldPop(currentMult float64, pumpCount int) bool {
	if houseBalance.Load() <= 0 {
		return true
	}
	if currentMult < 1.08 {
		return false
	}
	risk := 0.018 + float64(pumpCount)*0.007
	if houseBalance.Load() < 100_000_00 {
		risk += 0.12
	}
	return randomUnit() < risk
}

func randomUnit() float64 {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return float64(binary.LittleEndian.Uint64(b[:])%1_000_000) / 1_000_000
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
