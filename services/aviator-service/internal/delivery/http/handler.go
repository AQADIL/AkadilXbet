package http

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"

	"github.com/akadilxbet/aviator-service/internal/client"
	"github.com/akadilxbet/aviator-service/internal/domain"
	"github.com/akadilxbet/aviator-service/internal/usecase"
)

type Handler struct {
	uc      *usecase.AviatorUseCase
	balance *client.BalanceStore
}

const DemoUserID = "00000000-0000-0000-0000-000000000001"

func NewHandler(uc *usecase.AviatorUseCase, balance *client.BalanceStore) *Handler {
	return &Handler{uc: uc, balance: balance}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		jsonOK(w, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/v1/aviator/round", h.getRound)
	mux.HandleFunc("POST /api/v1/aviator/bets", h.placeBet)
	mux.HandleFunc("POST /api/v1/aviator/cashout", h.cashOut)
	mux.HandleFunc("POST /api/v1/aviator/auto-cashout", h.autoCashOut)
	mux.HandleFunc("GET /api/v1/aviator/balance", h.getBalance)
	mux.HandleFunc("GET /api/v1/aviator/stream", h.stream)
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

func (h *Handler) getRound(w http.ResponseWriter, r *http.Request) {
	round, err := h.uc.GetCurrentRound(r.Context())
	if err != nil {
		jsonErr(w, http.StatusNotFound, err.Error())
		return
	}
	jsonOK(w, formatRound(round))
}

func (h *Handler) placeBet(w http.ResponseWriter, r *http.Request) {
	uid := userID(r)
	var body struct {
		AmountCents int64 `json:"amount_cents"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.AmountCents <= 0 {
		jsonErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	bet, bal, err := h.uc.PlaceBet(r.Context(), uid, body.AmountCents)
	if err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{
		"bet_id": bet.ID, "round_id": bet.RoundID, "status": bet.Status, "balance_cents": bal,
	})
}

func (h *Handler) cashOut(w http.ResponseWriter, r *http.Request) {
	uid := userID(r)
	var body struct {
		BetID string `json:"bet_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	bet, bal, err := h.uc.CashOut(r.Context(), uid, body.BetID, 0)
	if err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{
		"multiplier": bet.CashoutMultiplier, "payout_cents": bet.PayoutCents, "balance_cents": bal,
	})
}

func (h *Handler) autoCashOut(w http.ResponseWriter, r *http.Request) {
	uid := userID(r)
	var body struct {
		BetID      string  `json:"bet_id"`
		Multiplier float64 `json:"multiplier"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := h.uc.SetAutoCashOut(r.Context(), uid, body.BetID, body.Multiplier); err != nil {
		jsonErr(w, http.StatusPreconditionFailed, err.Error())
		return
	}
	jsonOK(w, map[string]any{"active": true, "multiplier": body.Multiplier})
}

func (h *Handler) getBalance(w http.ResponseWriter, r *http.Request) {
	uid := userID(r)
	bal, err := h.balance.Get(r.Context(), uid)
	if err != nil {
		jsonErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonOK(w, map[string]any{"balance_cents": bal})
}

func (h *Handler) stream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonErr(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := h.uc.Subscribe()
	for {
		select {
		case <-r.Context().Done():
			return
		case round := <-ch:
			if round == nil {
				continue
			}
			_, _ = fmt.Fprintf(w, "data: %s\n\n", mustJSON(formatRound(round)))
			flusher.Flush()
		}
	}
}

func formatRound(r *domain.Round) map[string]any {
	return map[string]any{
		"round_id":           r.ID,
		"status":             r.Status,
		"current_multiplier": r.CurrentMultiplier,
		"crash_multiplier":   r.CrashMultiplier,
	}
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
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
