package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/akadilxbet/push-service/internal/config"
	"github.com/akadilxbet/push-service/internal/repository"
	webpush "github.com/SherClockHolmes/webpush-go"
)

type Handler struct {
	cfg  *config.Config
	repo *repository.Repo
}

func New(cfg *config.Config, repo *repository.Repo) *Handler {
	return &Handler{cfg: cfg, repo: repo}
}

func (h *Handler) Subscribe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Endpoint string          `json:"endpoint"`
		Keys     json.RawMessage `json:"keys"`
		UserID   string          `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	userID := req.UserID
	if userID == "" {
		userID = "demo-user"
	}

	if err := h.repo.SaveSubscription(r.Context(), userID, req.Endpoint, req.Keys); err != nil {
		slog.Error("save subscription failed", "err", err)
		http.Error(w, `{"error":"failed to save"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"subscribed"}`))
}

func (h *Handler) Unsubscribe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Endpoint string `json:"endpoint"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	if err := h.repo.DeleteSubscription(r.Context(), req.Endpoint); err != nil {
		slog.Error("delete subscription failed", "err", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"unsubscribed"}`))
}

func (h *Handler) Send(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID  string `json:"user_id"`
		Title   string `json:"title"`
		Body    string `json:"body"`
		Tag     string `json:"tag"`
		Data    any    `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}

	userID := req.UserID
	if userID == "" {
		userID = "demo-user"
	}

	subs, err := h.repo.GetSubscriptions(r.Context(), userID)
	if err != nil {
		slog.Error("get subscriptions failed", "err", err)
		http.Error(w, `{"error":"failed to get subscriptions"}`, http.StatusInternalServerError)
		return
	}

	payload, _ := json.Marshal(map[string]any{
		"title": req.Title,
		"body":  req.Body,
		"tag":   req.Tag,
		"data":  req.Data,
	})

	for _, sub := range subs {
		s := &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys:     webpush.Keys{},
		}
		json.Unmarshal(sub.Keys, &s.Keys)

		resp, err := webpush.SendNotification(payload, s, &webpush.Options{
			Subscriber:      h.cfg.Subject,
			VAPIDPublicKey:  h.cfg.VAPIDPublicKey,
			VAPIDPrivateKey: h.cfg.VAPIDPrivateKey,
			TTL:             30,
		})
		if err != nil {
			slog.Error("send notification failed", "err", err, "endpoint", sub.Endpoint)
			continue
		}
		resp.Body.Close()
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"sent"}`))
}
