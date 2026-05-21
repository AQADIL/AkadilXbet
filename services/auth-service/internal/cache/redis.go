package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/akadilxbet/auth-service/internal/domain"
	"github.com/redis/go-redis/v9"
)

const userProfileTTL = 15 * time.Minute

type UserCache struct {
	client *redis.Client
}

func NewUserCache(client *redis.Client) *UserCache {
	return &UserCache{client: client}
}

func profileKey(userID string) string {
	return "user:profile:" + userID
}

func (c *UserCache) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
	data, err := c.client.Get(ctx, profileKey(userID)).Bytes()
	if err != nil {
		return nil, err
	}
	var u domain.User
	if err := json.Unmarshal(data, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (c *UserCache) SetProfile(ctx context.Context, u *domain.User) error {
	data, err := json.Marshal(u)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, profileKey(u.ID), data, userProfileTTL).Err()
}

func (c *UserCache) DeleteProfile(ctx context.Context, userID string) error {
	return c.client.Del(ctx, profileKey(userID)).Err()
}
