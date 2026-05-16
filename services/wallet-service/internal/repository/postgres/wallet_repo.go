package postgres

import (
	"context"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type walletRepo struct {
	db *pgxpool.Pool
}

func NewWalletRepo(db *pgxpool.Pool) *walletRepo {
	return &walletRepo{db: db}
}

func (r *walletRepo) GetBalance(ctx context.Context, userID string) (int64, error) {
	var balance int64
	err := r.db.QueryRow(ctx,
		`SELECT balance FROM wallets WHERE user_id = $1`,
		userID,
	).Scan(&balance)
	return balance, err
}

func (r *walletRepo) Deposit(ctx context.Context, userID string, amount int64) (int64, error) {
	var balance int64
	err := r.db.QueryRow(ctx,
		`UPDATE wallets SET balance = balance + $2, updated_at = NOW()
		 WHERE user_id = $1
		 RETURNING balance`,
		userID, amount,
	).Scan(&balance)
	return balance, err
}

func (r *walletRepo) Deduct(ctx context.Context, userID string, amount int64) (int64, error) {
	var balance int64
	err := r.db.QueryRow(ctx,
		`UPDATE wallets SET balance = balance - $2, updated_at = NOW()
		 WHERE user_id = $1 AND balance >= $2
		 RETURNING balance`,
		userID, amount,
	).Scan(&balance)
	if err != nil {
		return 0, domain.ErrInsufficientFunds{}
	}
	return balance, nil
}
