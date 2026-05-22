package client

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

type WalletClient struct {
	db *pgxpool.Pool
}

func NewWalletClient(db *pgxpool.Pool) *WalletClient {
	return &WalletClient{db: db}
}

func (w *WalletClient) GetBalance(ctx context.Context, userID string) (int64, error) {
	var balanceCents int64
	err := w.db.QueryRow(ctx, "SELECT balance_cents FROM wallets WHERE user_id = $1", userID).Scan(&balanceCents)
	if err != nil {
		return 0, err
	}
	return balanceCents, nil
}

func (w *WalletClient) Deduct(ctx context.Context, userID string, amountCents int64, description string) (int64, error) {
	var newBalance int64
	err := w.db.QueryRow(ctx,
		`UPDATE wallets SET balance_cents = balance_cents - $1, updated_at = NOW()
		 WHERE user_id = $2 AND balance_cents >= $1
		 RETURNING balance_cents`,
		amountCents, userID,
	).Scan(&newBalance)
	if err != nil {
		return 0, err
	}

	_, _ = w.db.Exec(ctx,
		`INSERT INTO wallet_transactions (id, user_id, type, amount_cents, description, created_at)
		 VALUES (gen_random_uuid(), $1, 'bet', $2, $3, NOW())`,
		userID, amountCents, description,
	)

	return newBalance, nil
}

func (w *WalletClient) Deposit(ctx context.Context, userID string, amountCents int64, description string) (int64, error) {
	var newBalance int64
	err := w.db.QueryRow(ctx,
		`UPDATE wallets SET balance_cents = balance_cents + $1, updated_at = NOW()
		 WHERE user_id = $2
		 RETURNING balance_cents`,
		amountCents, userID,
	).Scan(&newBalance)
	if err != nil {
		slog.Error("failed to deposit", "err", err)
		return 0, err
	}

	_, _ = w.db.Exec(ctx,
		`INSERT INTO wallet_transactions (id, user_id, type, amount_cents, description, created_at)
		 VALUES (gen_random_uuid(), $1, 'win', $2, $3, NOW())`,
		userID, amountCents, description,
	)

	return newBalance, nil
}
