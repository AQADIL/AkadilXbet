package usecase

import (
	"testing"

	"github.com/akadilxbet/pkg/bankrtp"
)

func TestBankRTP_ForcedMinimumWhenEmpty(t *testing.T) {
	bankrtp.RecordDelta(-bankrtp.GetHouseBalance())
	cp := bankrtp.GetCrashPoint(100)
	if cp.Multiplier > 1.05 {
		t.Fatalf("expected low crash when bank empty, got %v", cp.Multiplier)
	}
}
