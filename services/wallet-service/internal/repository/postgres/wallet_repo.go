package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type walletRepo struct {
	db *pgxpool.Pool
}

func NewWalletRepo(db *pgxpool.Pool) *walletRepo {
	return &walletRepo{db: db}
}

func (r *walletRepo) Create(ctx context.Context, userID string, startingBalanceCents int64) (*domain.Wallet, error) {
	var w domain.Wallet
	err := r.db.QueryRow(ctx,
		`INSERT INTO wallets (user_id, balance_cents)
		 VALUES ($1, $2)
		 RETURNING id, user_id, balance_cents, updated_at`,
		userID, startingBalanceCents,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrWalletAlreadyExists{}
		}
		return nil, err
	}
	return &w, nil
}

func (r *walletRepo) GetByUserID(ctx context.Context, userID string) (*domain.Wallet, error) {
	var w domain.Wallet
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, balance_cents, updated_at FROM wallets WHERE user_id = $1`,
		userID,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrWalletNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *walletRepo) Deposit(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var w domain.Wallet
	err = tx.QueryRow(ctx,
		`SELECT id, user_id, balance_cents, updated_at FROM wallets WHERE user_id = $1 FOR UPDATE`,
		userID,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrWalletNotFound{}
	}
	if err != nil {
		return nil, err
	}

	err = tx.QueryRow(ctx,
		`UPDATE wallets SET balance_cents = balance_cents + $2, updated_at = NOW()
		 WHERE user_id = $1
		 RETURNING id, user_id, balance_cents, updated_at`,
		userID, amountCents,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *walletRepo) Deduct(ctx context.Context, userID string, amountCents int64) (*domain.Wallet, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var w domain.Wallet
	err = tx.QueryRow(ctx,
		`SELECT id, user_id, balance_cents, updated_at FROM wallets WHERE user_id = $1 FOR UPDATE`,
		userID,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrWalletNotFound{}
	}
	if err != nil {
		return nil, err
	}

	if w.BalanceCents < amountCents {
		return nil, domain.ErrInsufficientFunds{}
	}

	err = tx.QueryRow(ctx,
		`UPDATE wallets SET balance_cents = balance_cents - $2, updated_at = NOW()
		 WHERE user_id = $1
		 RETURNING id, user_id, balance_cents, updated_at`,
		userID, amountCents,
	).Scan(&w.ID, &w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &w, nil
}
