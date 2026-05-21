package config

import (
	"os"
	"strconv"
)

type Config struct {
	GRPCPort       string
	PostgresDSN    string
	RedisAddr      string
	RedisPassword  string
	NatsURL        string
	JWTSecret      string
	JWTExpiryHours int
}

func Load() *Config {
	return &Config{
		GRPCPort:       getEnv("AUTH_SERVICE_GRPC_PORT", "50051"),
		PostgresDSN:    buildPostgresDSN(),
		RedisAddr:      getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		JWTSecret:      mustGetEnv("JWT_SECRET"),
		JWTExpiryHours: mustGetEnvInt("JWT_EXPIRY_HOURS", 24),
	}
}

func buildPostgresDSN() string {
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "akadilxbet")
	pass := getEnv("POSTGRES_PASSWORD", "")
	db := getEnv("POSTGRES_DB", "akadilxbet_db")
	return "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + db + "?sslmode=disable"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required environment variable not set: " + key)
	}
	return v
}

func mustGetEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
