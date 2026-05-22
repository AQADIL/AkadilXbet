package redis

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/akadilxbet/aviator-service/internal/domain"
	goredis "github.com/redis/go-redis/v9"
)

const currentRoundKey = "aviator:round:current"

type RoundCache struct {
	rdb *goredis.Client
}

func NewRoundCache(rdb *goredis.Client) *RoundCache {
	return &RoundCache{rdb: rdb}
}

func (c *RoundCache) SetCurrent(ctx context.Context, r *domain.Round) error {
	b, err := json.Marshal(r)
	if err != nil {
		return err
	}
	return c.rdb.Set(ctx, currentRoundKey, b, 0).Err()
}

func (c *RoundCache) GetCurrent(ctx context.Context) (*domain.Round, error) {
	data, err := c.rdb.Get(ctx, currentRoundKey).Bytes()
	if errors.Is(err, goredis.Nil) {
		return nil, domain.ErrRoundNotFound
	}
	if err != nil {
		return nil, err
	}
	var r domain.Round
	if err := json.Unmarshal(data, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

func (c *RoundCache) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return c.rdb.Ping(ctx).Err()
}
