package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PushSubscription struct {
	ID       string          `json:"id"`
	UserID   string          `json:"user_id"`
	Endpoint string          `json:"endpoint"`
	Keys     json.RawMessage `json:"keys"`
}

type Repo struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) SaveSubscription(ctx context.Context, userID string, endpoint string, keys json.RawMessage) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO push_subscriptions (id, user_id, endpoint, keys, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (endpoint) DO UPDATE SET user_id = $2, keys = $4, updated_at = NOW()
	`, uuid.NewString(), userID, endpoint, keys)
	return err
}

func (r *Repo) DeleteSubscription(ctx context.Context, endpoint string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM push_subscriptions WHERE endpoint = $1`, endpoint)
	return err
}

func (r *Repo) GetSubscriptions(ctx context.Context, userID string) ([]PushSubscription, error) {
	rows, err := r.db.Query(ctx, `SELECT id, user_id, endpoint, keys FROM push_subscriptions WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []PushSubscription
	for rows.Next() {
		var s PushSubscription
		if err := rows.Scan(&s.ID, &s.UserID, &s.Endpoint, &s.Keys); err != nil {
			continue
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func (r *Repo) GetAllSubscriptions(ctx context.Context) ([]PushSubscription, error) {
	rows, err := r.db.Query(ctx, `SELECT id, user_id, endpoint, keys FROM push_subscriptions`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []PushSubscription
	for rows.Next() {
		var s PushSubscription
		if err := rows.Scan(&s.ID, &s.UserID, &s.Endpoint, &s.Keys); err != nil {
			continue
		}
		subs = append(subs, s)
	}
	return subs, nil
}
