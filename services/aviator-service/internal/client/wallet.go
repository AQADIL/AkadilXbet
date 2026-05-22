package client

import (
	"context"
	"errors"

	goredis "github.com/redis/go-redis/v9"
)

const defaultBalanceCents = 100_000

type BalanceStore struct {
	rdb *goredis.Client
}

func NewBalanceStore(rdb *goredis.Client) *BalanceStore {
	return &BalanceStore{rdb: rdb}
}

func balanceKey(userID string) string { return "aviator:balance:" + userID }

func (s *BalanceStore) Get(ctx context.Context, userID string) (int64, error) {
	v, err := s.rdb.Get(ctx, balanceKey(userID)).Int64()
	if errors.Is(err, goredis.Nil) {
		if err := s.rdb.Set(ctx, balanceKey(userID), defaultBalanceCents, 0).Err(); err != nil {
			return 0, err
		}
		return defaultBalanceCents, nil
	}
	return v, err
}

func (s *BalanceStore) Deduct(ctx context.Context, userID string, amountCents int64) (int64, error) {
	key := balanceKey(userID)
	bal, err := s.Get(ctx, userID)
	if err != nil {
		return 0, err
	}
	if bal < amountCents {
		return 0, errors.New("insufficient funds")
	}
	newBal := bal - amountCents
	if err := s.rdb.Set(ctx, key, newBal, 0).Err(); err != nil {
		return 0, err
	}
	return newBal, nil
}

func (s *BalanceStore) Deposit(ctx context.Context, userID string, amountCents int64) (int64, error) {
	bal, err := s.Get(ctx, userID)
	if err != nil {
		return 0, err
	}
	newBal := bal + amountCents
	if err := s.rdb.Set(ctx, balanceKey(userID), newBal, 0).Err(); err != nil {
		return 0, err
	}
	return newBal, nil
}
