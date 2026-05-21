package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/akadilxbet/wallet-service/internal/usecase"
	"github.com/nats-io/nats.go"
)

const (
	subjectUserCreated      = "auth.user.created"
	promotionalStartCents   = 100000
)

type userCreatedEvent struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
}

type UserCreatedConsumer struct {
	uc *usecase.WalletUseCase
	nc *nats.Conn
}

func NewUserCreatedConsumer(nc *nats.Conn, uc *usecase.WalletUseCase) *UserCreatedConsumer {
	return &UserCreatedConsumer{nc: nc, uc: uc}
}

func (c *UserCreatedConsumer) Subscribe() (*nats.Subscription, error) {
	return c.nc.Subscribe(subjectUserCreated, func(msg *nats.Msg) {
		var event userCreatedEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			slog.Error("failed to unmarshal user created event", "err", err)
			return
		}

		if event.UserID == "" {
			slog.Warn("received user created event with empty user_id")
			return
		}

		_, err := c.uc.CreateWallet(context.Background(), event.UserID, promotionalStartCents)
		if err != nil {
			if errors.As(err, &domain.ErrWalletAlreadyExists{}) {
				slog.Info("wallet already exists, skipping", "user_id", event.UserID)
				return
			}
			slog.Error("failed to provision wallet", "user_id", event.UserID, "err", err)
			return
		}

		slog.Info("wallet provisioned", "user_id", event.UserID, "start_cents", promotionalStartCents)
	})
}
