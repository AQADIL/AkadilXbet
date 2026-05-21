package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/auth-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *userRepo {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, email, passwordHash string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, username, email, password_hash, created_at`,
		email, passwordHash,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrEmailTaken{}
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrUserNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByID(ctx context.Context, userID string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrUserNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) UpdateUsername(ctx context.Context, userID, username string) (*domain.User, error) {
	var u domain.User
	err := r.db.QueryRow(ctx,
		`UPDATE users
		 SET username = $2
		 WHERE id = $1
		 RETURNING id, username, email, password_hash, created_at`,
		userID, username,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrUserNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) EnsureWallet(ctx context.Context, userID string, startingBalanceCents int64) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO wallets (user_id, balance_cents)
		 VALUES ($1, $2)
		 ON CONFLICT (user_id) DO NOTHING`,
		userID, startingBalanceCents,
	)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx,
		`INSERT INTO wallet_transactions (user_id, type, amount_cents, description)
		 SELECT $1, 'bonus', $2, 'Welcome bonus'
		 WHERE NOT EXISTS (
		   SELECT 1 FROM wallet_transactions WHERE user_id = $1 AND type = 'bonus' AND description = 'Welcome bonus'
		 )`,
		userID, startingBalanceCents,
	)
	return err
}

func (r *userRepo) GetWallet(ctx context.Context, userID string) (*domain.Wallet, error) {
	var w domain.Wallet
	err := r.db.QueryRow(ctx,
		`SELECT user_id, balance_cents, updated_at FROM wallets WHERE user_id = $1`,
		userID,
	).Scan(&w.UserID, &w.BalanceCents, &w.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrWalletNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *userRepo) ListWalletTransactions(ctx context.Context, userID string, limit int) ([]domain.WalletTransaction, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, type, amount_cents, description, created_at
		 FROM wallet_transactions
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := make([]domain.WalletTransaction, 0, limit)
	for rows.Next() {
		var t domain.WalletTransaction
		if err := rows.Scan(&t.ID, &t.UserID, &t.Type, &t.AmountCents, &t.Description, &t.CreatedAt); err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}
