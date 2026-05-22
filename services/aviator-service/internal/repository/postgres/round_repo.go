package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/aviator-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoundRepo struct {
	db *pgxpool.Pool
}

func NewRoundRepo(db *pgxpool.Pool) *RoundRepo {
	return &RoundRepo{db: db}
}

func (r *RoundRepo) Create(ctx context.Context, round *domain.Round) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO aviator_rounds (id, status, current_multiplier, crash_multiplier, total_bet_cents, started_at)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		round.ID, round.Status, round.CurrentMultiplier, round.CrashMultiplier, round.TotalBetCents, round.StartedAt,
	)
	return err
}

func (r *RoundRepo) Update(ctx context.Context, round *domain.Round) error {
	_, err := r.db.Exec(ctx,
		`UPDATE aviator_rounds SET status=$2, current_multiplier=$3, crash_multiplier=$4,
		 total_bet_cents=$5, crashed_at=$6 WHERE id=$1`,
		round.ID, round.Status, round.CurrentMultiplier, round.CrashMultiplier, round.TotalBetCents, round.CrashedAt,
	)
	return err
}

func (r *RoundRepo) GetByID(ctx context.Context, id string) (*domain.Round, error) {
	var round domain.Round
	err := r.db.QueryRow(ctx,
		`SELECT id, status, current_multiplier, crash_multiplier, total_bet_cents, started_at, crashed_at
		 FROM aviator_rounds WHERE id=$1`, id,
	).Scan(&round.ID, &round.Status, &round.CurrentMultiplier, &round.CrashMultiplier,
		&round.TotalBetCents, &round.StartedAt, &round.CrashedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrRoundNotFound
	}
	return &round, err
}

func (r *RoundRepo) GetLatest(ctx context.Context) (*domain.Round, error) {
	var round domain.Round
	err := r.db.QueryRow(ctx,
		`SELECT id, status, current_multiplier, crash_multiplier, total_bet_cents, started_at, crashed_at
		 FROM aviator_rounds ORDER BY started_at DESC LIMIT 1`,
	).Scan(&round.ID, &round.Status, &round.CurrentMultiplier, &round.CrashMultiplier,
		&round.TotalBetCents, &round.StartedAt, &round.CrashedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrRoundNotFound
	}
	return &round, err
}

func (r *RoundRepo) ListHistory(ctx context.Context, limit int) ([]*domain.Round, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.db.Query(ctx,
		`SELECT id, status, current_multiplier, crash_multiplier, total_bet_cents, started_at, crashed_at
		 FROM aviator_rounds ORDER BY started_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*domain.Round
	for rows.Next() {
		var round domain.Round
		if err := rows.Scan(&round.ID, &round.Status, &round.CurrentMultiplier, &round.CrashMultiplier,
			&round.TotalBetCents, &round.StartedAt, &round.CrashedAt); err != nil {
			return nil, err
		}
		out = append(out, &round)
	}
	return out, rows.Err()
}
