package http

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/akadilxbet/balloon-service/internal/client"
	"github.com/akadilxbet/balloon-service/internal/domain"
	"github.com/akadilxbet/balloon-service/internal/usecase"
)

type Handler struct {
	uc      *usecase.BalloonUseCase
	balance *client.BalanceStore
}

const DemoUserID = "00000000-0000-0000-0000-000000000001"

func NewHandler(uc *usecase.BalloonUseCase, balance *client.BalanceStore) *Handler {
	return &Handler{uc: uc, balance: balance}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		jsonOK(w, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/v1/balloon/session", h.getSession)
	mux.HandleFunc("POST /api/v1/balloon/bets", h.placeBet)
	mux.HandleFunc("POST /api/v1/balloon/pump", h.pump)
	mux.HandleFunc("POST /api/v1/balloon/release", h.release)
	mux.HandleFunc("GET /api/v1/balloon/balance", h.getBalance)
	mux.HandleFunc("GET /api/v1/balloon/config", h.config)
}

func userID(r *http.Request) string {
	id := r.Header.Get("X-User-ID")
	if id != "" {
		if _, err := uuid.Parse(id); err == nil {
			return id
		}
	}
	return DemoUserID
}

func (h *Handler) getSession(w http.ResponseWriter, r *http.Request) {
	s, err := h.uc.GetActiveSession(r.Context(), userID(r))
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, sessionJSON(s))
}

func (h *Handler) placeBet(w http.ResponseWriter, r *http.Request) {
	var body struct {
		AmountCents int64 `json:"amount_cents"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	s, bal, err := h.uc.PlaceBet(r.Context(), userID(r), body.AmountCents)
	if err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{"session": sessionJSON(s), "balance_cents": bal})
}

func (h *Handler) pump(w http.ResponseWriter, r *http.Request) {
	s, popped, err := h.uc.Pump(r.Context(), userID(r))
	if err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{"session": sessionJSON(s), "popped": popped})
}

func (h *Handler) release(w http.ResponseWriter, r *http.Request) {
	s, bal, err := h.uc.Release(r.Context(), userID(r))
	if err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{
		"session": sessionJSON(s), "balance_cents": bal,
		"payout_cents": s.PayoutCents, "multiplier": s.CurrentMultiplier,
	})
}

func (h *Handler) getBalance(w http.ResponseWriter, r *http.Request) {
	bal, err := h.balance.Get(r.Context(), userID(r))
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, map[string]any{"balance_cents": bal})
}

func (h *Handler) config(w http.ResponseWriter, r *http.Request) {
	cfg := h.uc.GetConfig()
	jsonOK(w, map[string]any{
		"min_bet_cents": cfg.MinBetCents,
		"max_bet_cents": cfg.MaxBetCents,
	})
}

func sessionJSON(s *domain.Session) map[string]any {
	return map[string]any{
		"session_id": s.ID, "status": s.Status,
		"current_multiplier": s.CurrentMultiplier,
		"bet_amount_cents":   s.BetAmountCents,
	}
}

func jsonOK(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func jsonErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
