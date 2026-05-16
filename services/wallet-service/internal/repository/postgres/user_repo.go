package postgres

import (
	"context"
	"errors"

	"github.com/akadilxbet/wallet-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type userRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *userRepo {
	return &userRepo{db: db}
}

func (r *userRepo) GetByID(ctx context.Context, userID string) (*domain.User, error) {
	var u domain.User
	row := r.db.QueryRow(ctx,
		`SELECT id, username, email, created_at FROM users WHERE id = $1`,
		userID,
	)
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrUserNotFound{}
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}
