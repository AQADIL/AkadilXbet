package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/aviator-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BetRepo struct {
	db *pgxpool.Pool
}

func NewBetRepo(db *pgxpool.Pool) *BetRepo {
	return &BetRepo{db: db}
}

func (r *BetRepo) Create(ctx context.Context, b *domain.Bet) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO aviator_bets (id, round_id, user_id, amount_cents, status, auto_cashout_mult)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		b.ID, b.RoundID, b.UserID, b.AmountCents, b.Status, b.AutoCashoutMult,
	)
	return err
}

func (r *BetRepo) Update(ctx context.Context, b *domain.Bet) error {
	_, err := r.db.Exec(ctx,
		`UPDATE aviator_bets SET status=$2, auto_cashout_mult=$3, cashout_multiplier=$4, payout_cents=$5 WHERE id=$1`,
		b.ID, b.Status, b.AutoCashoutMult, b.CashoutMultiplier, b.PayoutCents,
	)
	return err
}

func (r *BetRepo) GetByID(ctx context.Context, id string) (*domain.Bet, error) {
	var b domain.Bet
	err := r.db.QueryRow(ctx,
		`SELECT id, round_id, user_id, amount_cents, status, auto_cashout_mult, cashout_multiplier, payout_cents
		 FROM aviator_bets WHERE id=$1`, id,
	).Scan(&b.ID, &b.RoundID, &b.UserID, &b.AmountCents, &b.Status, &b.AutoCashoutMult, &b.CashoutMultiplier, &b.PayoutCents)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrBetNotFound
	}
	return &b, err
}

func (r *BetRepo) ListByRound(ctx context.Context, roundID string) ([]*domain.Bet, error) {
	return r.queryBets(ctx, `SELECT id, round_id, user_id, amount_cents, status, auto_cashout_mult, cashout_multiplier, payout_cents
		FROM aviator_bets WHERE round_id=$1 ORDER BY created_at DESC`, roundID)
}

func (r *BetRepo) ListActiveByUserRound(ctx context.Context, userID, roundID string) ([]*domain.Bet, error) {
	return r.queryBets(ctx, `SELECT id, round_id, user_id, amount_cents, status, auto_cashout_mult, cashout_multiplier, payout_cents
		FROM aviator_bets WHERE user_id=$1 AND round_id=$2 AND status IN ('pending','active')`, userID, roundID)
}

func (r *BetRepo) ListActiveByRound(ctx context.Context, roundID string) ([]*domain.Bet, error) {
	return r.queryBets(ctx, `SELECT id, round_id, user_id, amount_cents, status, auto_cashout_mult, cashout_multiplier, payout_cents
		FROM aviator_bets WHERE round_id=$1 AND status IN ('pending','active')`, roundID)
}

func (r *BetRepo) queryBets(ctx context.Context, q string, args ...any) ([]*domain.Bet, error) {
	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*domain.Bet
	for rows.Next() {
		var b domain.Bet
		if err := rows.Scan(&b.ID, &b.RoundID, &b.UserID, &b.AmountCents, &b.Status, &b.AutoCashoutMult, &b.CashoutMultiplier, &b.PayoutCents); err != nil {
			return nil, err
		}
		out = append(out, &b)
	}
	return out, rows.Err()
}

func (r *BetRepo) PlayerStats(ctx context.Context, userID string) (int32, int32, int64, int64, error) {
	var bets, wins int32
	var wagered, won int64
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*)::int, COUNT(*) FILTER (WHERE status='cashed_out')::int,
		        COALESCE(SUM(amount_cents),0), COALESCE(SUM(payout_cents),0)
		 FROM aviator_bets WHERE user_id=$1`, userID,
	).Scan(&bets, &wins, &wagered, &won)
	return bets, wins, wagered, won, err
}
