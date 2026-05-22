package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/balloon-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepo struct {
	db *pgxpool.Pool
}

func NewSessionRepo(db *pgxpool.Pool) *SessionRepo {
	return &SessionRepo{db: db}
}

func (r *SessionRepo) Create(ctx context.Context, s *domain.Session) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO balloon_sessions (id, user_id, status, bet_amount_cents, current_multiplier, pump_count, payout_cents, started_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		s.ID, s.UserID, s.Status, s.BetAmountCents, s.CurrentMultiplier, s.PumpCount, s.PayoutCents, s.StartedAt,
	)
	return err
}

func (r *SessionRepo) Update(ctx context.Context, s *domain.Session) error {
	_, err := r.db.Exec(ctx,
		`UPDATE balloon_sessions SET status=$2, current_multiplier=$3, pump_count=$4, payout_cents=$5, ended_at=$6 WHERE id=$1`,
		s.ID, s.Status, s.CurrentMultiplier, s.PumpCount, s.PayoutCents, s.EndedAt,
	)
	return err
}

func (r *SessionRepo) GetByID(ctx context.Context, id string) (*domain.Session, error) {
	var s domain.Session
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, status, bet_amount_cents, current_multiplier, pump_count, payout_cents, started_at, ended_at
		 FROM balloon_sessions WHERE id=$1`, id,
	).Scan(&s.ID, &s.UserID, &s.Status, &s.BetAmountCents, &s.CurrentMultiplier, &s.PumpCount, &s.PayoutCents, &s.StartedAt, &s.EndedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("session not found")
	}
	return &s, err
}

func (r *SessionRepo) GetActiveByUser(ctx context.Context, userID string) (*domain.Session, error) {
	var s domain.Session
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, status, bet_amount_cents, current_multiplier, pump_count, payout_cents, started_at, ended_at
		 FROM balloon_sessions WHERE user_id=$1 AND status='active' ORDER BY started_at DESC LIMIT 1`, userID,
	).Scan(&s.ID, &s.UserID, &s.Status, &s.BetAmountCents, &s.CurrentMultiplier, &s.PumpCount, &s.PayoutCents, &s.StartedAt, &s.EndedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &s, err
}

func (r *SessionRepo) ListHistory(ctx context.Context, userID string, limit int) ([]*domain.Session, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, status, bet_amount_cents, current_multiplier, pump_count, payout_cents, started_at, ended_at
		 FROM balloon_sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*domain.Session
	for rows.Next() {
		var s domain.Session
		if err := rows.Scan(&s.ID, &s.UserID, &s.Status, &s.BetAmountCents, &s.CurrentMultiplier, &s.PumpCount, &s.PayoutCents, &s.StartedAt, &s.EndedAt); err != nil {
			return nil, err
		}
		out = append(out, &s)
	}
	return out, rows.Err()
}

func (r *SessionRepo) PlayerStats(ctx context.Context, userID string) (sessions, wins int32, wagered, won int64, err error) {
	err = r.db.QueryRow(ctx,
		`SELECT COUNT(*)::int, COUNT(*) FILTER (WHERE status='won')::int,
		 COALESCE(SUM(bet_amount_cents),0), COALESCE(SUM(payout_cents),0)
		 FROM balloon_sessions WHERE user_id=$1`, userID,
	).Scan(&sessions, &wins, &wagered, &won)
	return
}
