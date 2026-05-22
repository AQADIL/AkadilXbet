package bankrtp

import "testing"

func TestGetCrashPoint_EmptyBank(t *testing.T) {
	houseBalance.Store(0)
	cp := GetCrashPoint(100)
	if !cp.ForceMinimum || cp.Multiplier > 1.05 {
		t.Fatalf("expected forced 1x, got %+v", cp)
	}
	houseBalance.Store(1_000_000_00)
}
