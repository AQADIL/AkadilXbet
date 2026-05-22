package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/akadilxbet/scratch-service/internal/rtp"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db        *pgxpool.Pool
	jwtSecret []byte
}

func New(db *pgxpool.Pool, jwtSecret string) *Handler {
	return &Handler{db: db, jwtSecret: []byte(jwtSecret)}
}

type playReq struct {
	BetCredits int64 `json:"bet_credits"`
}

type playResp struct {
	Symbols       []int   `json:"symbols"`
	WinLine       []int   `json:"win_line"`
	WinMultiplier float64 `json:"win_multiplier"`
	PayoutCredits int64   `json:"payout_credits"`
	NewBalance    int64   `json:"new_balance_credits"`
}

func (h *Handler) Play(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	var req playReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.BetCredits <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid bet"})
		return
	}

	betCents := req.BetCredits * 100
	ctx := r.Context()

	// Atomically deduct bet from wallet
	var balanceCentsAfterBet int64
	err := h.db.QueryRow(ctx,
		`UPDATE wallets SET balance_cents = balance_cents - $1, updated_at = NOW()
		 WHERE user_id = $2 AND balance_cents >= $1
		 RETURNING balance_cents`,
		betCents, userID,
	).Scan(&balanceCentsAfterBet)
	if err != nil {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"message": "insufficient funds"})
		return
	}

	_, _ = h.db.Exec(ctx,
		`INSERT INTO wallet_transactions (id, user_id, type, amount_cents, description, created_at)
		 VALUES (gen_random_uuid(), $1, 'bet', $2, 'Scratch Loto bet', NOW())`,
		userID, betCents,
	)

	result := rtp.CalculateScratch(betCents, balanceCentsAfterBet)

	finalBalanceCents := balanceCentsAfterBet
	if result.PayoutCents > 0 {
		if err := h.db.QueryRow(ctx,
			`UPDATE wallets SET balance_cents = balance_cents + $1, updated_at = NOW()
			 WHERE user_id = $2
			 RETURNING balance_cents`,
			result.PayoutCents, userID,
		).Scan(&finalBalanceCents); err != nil {
			slog.Error("failed to credit winnings", "err", err)
		}

		_, _ = h.db.Exec(ctx,
			`INSERT INTO wallet_transactions (id, user_id, type, amount_cents, description, created_at)
			 VALUES (gen_random_uuid(), $1, 'win', $2, 'Scratch Loto win', NOW())`,
			userID, result.PayoutCents,
		)
	}

	writeJSON(w, http.StatusOK, playResp{
		Symbols:       result.Symbols,
		WinLine:       result.WinLine,
		WinMultiplier: result.WinMultiplier,
		PayoutCredits: result.PayoutCents / 100,
		NewBalance:    finalBalanceCents / 100,
	})
}

func (h *Handler) Balance(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}
	var balanceCents int64
	if err := h.db.QueryRow(r.Context(),
		`SELECT balance_cents FROM wallets WHERE user_id = $1`, userID,
	).Scan(&balanceCents); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "wallet not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balance_credits": balanceCents / 100})
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "scratch-service"})
}

func (h *Handler) authorize(r *http.Request) (string, bool) {
	auth := strings.TrimSpace(r.Header.Get("Authorization"))
	if auth == "" {
		return "", false
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return "", false
	}
	token, err := jwt.ParseWithClaims(strings.TrimSpace(parts[1]), &jwt.RegisteredClaims{},
		func(t *jwt.Token) (interface{}, error) {
			if t.Method != jwt.SigningMethodHS256 {
				return nil, jwt.ErrSignatureInvalid
			}
			return h.jwtSecret, nil
		})
	if err != nil || !token.Valid {
		return "", false
	}
	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || claims.Subject == "" {
		return "", false
	}
	return claims.Subject, true
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
