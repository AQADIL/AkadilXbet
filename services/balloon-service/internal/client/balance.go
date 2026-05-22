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

func balanceKey(userID string) string { return "balloon:balance:" + userID }

func (s *BalanceStore) Get(ctx context.Context, userID string) (int64, error) {
	v, err := s.rdb.Get(ctx, balanceKey(userID)).Int64()
	if errors.Is(err, goredis.Nil) {
		_ = s.rdb.Set(ctx, balanceKey(userID), defaultBalanceCents, 0)
		return defaultBalanceCents, nil
	}
	return v, err
}

func (s *BalanceStore) Deduct(ctx context.Context, userID string, amount int64) (int64, error) {
	bal, err := s.Get(ctx, userID)
	if err != nil {
		return 0, err
	}
	if bal < amount {
		return 0, errors.New("insufficient funds")
	}
	newBal := bal - amount
	return newBal, s.rdb.Set(ctx, balanceKey(userID), newBal, 0).Err()
}

func (s *BalanceStore) Deposit(ctx context.Context, userID string, amount int64) (int64, error) {
	bal, err := s.Get(ctx, userID)
	if err != nil {
		return 0, err
	}
	newBal := bal + amount
	return newBal, s.rdb.Set(ctx, balanceKey(userID), newBal, 0).Err()
}
