package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/akadilxbet/slots-service/internal/rtp"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
)

type Handler struct {
	db        *pgxpool.Pool
	jwtSecret []byte
	nc        *nats.Conn
}

func New(db *pgxpool.Pool, jwtSecret string, nc *nats.Conn) *Handler {
	return &Handler{db: db, jwtSecret: []byte(jwtSecret), nc: nc}
}

type spinReq struct {
	BetCredits int64 `json:"bet_credits"`
}

type spinResp struct {
	Reels         [3]int  `json:"reels"`
	Multiplier    float64 `json:"multiplier"`
	PayoutCredits int64   `json:"payout_credits"`
	NewBalance    int64   `json:"new_balance_credits"`
}

func (h *Handler) Spin(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	var req spinReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.BetCredits <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid bet"})
		return
	}

	betCents := req.BetCredits * 100
	ctx := r.Context()

	// Atomically deduct bet
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
		 VALUES (gen_random_uuid(), $1, 'bet', $2, 'Slots spin', NOW())`,
		userID, betCents,
	)

	result := rtp.CalculateSlots(betCents, balanceCentsAfterBet)

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
			 VALUES (gen_random_uuid(), $1, 'win', $2, 'Slots win', NOW())`,
			userID, result.PayoutCents,
		)

		// Send push notification for win
		if h.nc != nil {
			payload := `{"user_id":"` + userID + `","title":"Slots win!","body":"You won ` + strconv.FormatInt(result.PayoutCents/100, 10) + ` credits","tag":"win"}`
			_ = h.nc.Publish("notification.send", []byte(payload))
		}
	}

	writeJSON(w, http.StatusOK, spinResp{
		Reels:         result.Reels,
		Multiplier:    result.Multiplier,
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
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "slots-service"})
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
