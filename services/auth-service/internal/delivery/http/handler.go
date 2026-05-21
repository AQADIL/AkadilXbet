package authhttp

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/akadilxbet/auth-service/internal/domain"
	"github.com/akadilxbet/auth-service/internal/usecase"
)

type AuthHTTPHandler struct {
	uc *usecase.AuthUseCase
}

func NewAuthHTTPHandler(uc *usecase.AuthUseCase) *AuthHTTPHandler {
	return &AuthHTTPHandler{uc: uc}
}

func (h *AuthHTTPHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /auth/register", h.register)
	mux.HandleFunc("POST /auth/login", h.login)
	mux.HandleFunc("GET /auth/profile", h.profile)
	mux.HandleFunc("PATCH /auth/profile", h.updateProfile)
	mux.HandleFunc("GET /auth/wallet", h.wallet)
	mux.HandleFunc("GET /auth/wallet/transactions", h.walletTransactions)
	mux.HandleFunc("GET /health", h.health)
}

type registerReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type profileUpdateReq struct {
	Username string `json:"username"`
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func (h *AuthHTTPHandler) register(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid body"})
		return
	}
	if req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "email and password are required"})
		return
	}

	userID, token, err := h.uc.Register(r.Context(), req.Email, req.Password)
	if err != nil {
		var e domain.ErrEmailTaken
		if errors.As(err, &e) {
			writeJSON(w, http.StatusConflict, map[string]string{"message": "email already registered"})
			return
		}
		slog.Error("register error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "registration failed"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"user_id":         userID,
		"token":           token,
		"username":        "",
		"onboarding_done": false,
	})
}

func (h *AuthHTTPHandler) login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid body"})
		return
	}
	if req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "email and password are required"})
		return
	}

	userID, token, err := h.uc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		var e domain.ErrInvalidCredentials
		if errors.As(err, &e) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "invalid credentials"})
			return
		}
		slog.Error("login error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "login failed"})
		return
	}

	profile, pErr := h.uc.GetUserProfile(r.Context(), userID)
	if pErr != nil {
		slog.Error("profile after login error", "err", pErr)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "login failed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user_id":         userID,
		"token":           token,
		"username":        profile.Username,
		"onboarding_done": profile.Username != "",
	})
}

func (h *AuthHTTPHandler) profile(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	user, err := h.uc.GetUserProfile(r.Context(), userID)
	if err != nil {
		var e domain.ErrUserNotFound
		if errors.As(err, &e) {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "user not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "failed to get profile"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user_id":    user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"created_at": user.CreatedAt.Unix(),
	})
}

func (h *AuthHTTPHandler) updateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	var req profileUpdateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "invalid body"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if len(req.Username) < 2 || len(req.Username) > 30 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "username must be 2-30 characters"})
		return
	}

	user, err := h.uc.UpdateUsername(r.Context(), userID, req.Username)
	if err != nil {
		var e domain.ErrUserNotFound
		if errors.As(err, &e) {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "user not found"})
			return
		}
		slog.Error("update profile error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "failed to update profile"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user_id":         user.ID,
		"username":        user.Username,
		"email":           user.Email,
		"onboarding_done": user.Username != "",
	})
}

func (h *AuthHTTPHandler) wallet(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	wallet, err := h.uc.GetWallet(r.Context(), userID)
	if err != nil {
		var e domain.ErrWalletNotFound
		if errors.As(err, &e) {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "wallet not found"})
			return
		}
		slog.Error("wallet error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "failed to get wallet"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user_id":       wallet.UserID,
		"balance_cents": wallet.BalanceCents,
		"updated_at":    wallet.UpdatedAt.Unix(),
	})
}

func (h *AuthHTTPHandler) walletTransactions(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.authorize(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "unauthorized"})
		return
	}

	limit := 50
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 && v <= 200 {
			limit = v
		}
	}

	transactions, err := h.uc.ListWalletTransactions(r.Context(), userID, limit)
	if err != nil {
		slog.Error("wallet transactions error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "failed to get transactions"})
		return
	}

	type txResp struct {
		ID          string `json:"id"`
		Type        string `json:"type"`
		AmountCents int64  `json:"amount_cents"`
		Description string `json:"description"`
		CreatedAt   int64  `json:"created_at"`
	}

	resp := make([]txResp, 0, len(transactions))
	for _, t := range transactions {
		resp = append(resp, txResp{
			ID:          t.ID,
			Type:        t.Type,
			AmountCents: t.AmountCents,
			Description: t.Description,
			CreatedAt:   t.CreatedAt.Unix(),
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": resp})
}

func (h *AuthHTTPHandler) authorize(r *http.Request) (string, bool) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return "", false
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", false
	}

	userID, err := h.uc.VerifyToken(strings.TrimSpace(parts[1]))
	if err != nil {
		return "", false
	}

	return userID, true
}

func (h *AuthHTTPHandler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
