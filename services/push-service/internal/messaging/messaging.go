package messaging

import (
	"context"
	"encoding/json"
	"log/slog"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/akadilxbet/push-service/internal/config"
	"github.com/akadilxbet/push-service/internal/repository"
	"github.com/nats-io/nats.go"
)

func Subscribe(nc *nats.Conn, repo *repository.Repo, cfg *config.Config) {
	nc.Subscribe("notification.send", func(msg *nats.Msg) {
		var payload struct {
			UserID string `json:"user_id"`
			Title  string `json:"title"`
			Body   string `json:"body"`
			Tag    string `json:"tag"`
		}
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			slog.Error("unmarshal notification payload failed", "err", err)
			return
		}

		subs, err := repo.GetSubscriptions(context.Background(), payload.UserID)
		if err != nil {
			slog.Error("get subscriptions failed", "err", err)
			return
		}

		notificationPayload, _ := json.Marshal(map[string]any{
			"title": payload.Title,
			"body":  payload.Body,
			"tag":   payload.Tag,
		})

		for _, sub := range subs {
			s := &webpush.Subscription{
				Endpoint: sub.Endpoint,
				Keys:     webpush.Keys{},
			}
			json.Unmarshal(sub.Keys, &s.Keys)

			resp, err := webpush.SendNotification(notificationPayload, s, &webpush.Options{
				Subscriber:      cfg.Subject,
				VAPIDPublicKey:  cfg.VAPIDPublicKey,
				VAPIDPrivateKey: cfg.VAPIDPrivateKey,
				TTL:             30,
			})
			if err != nil {
				slog.Error("send push failed", "err", err)
				continue
			}
			resp.Body.Close()
		}
	})
}
