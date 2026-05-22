package config

import (
	"os"
	"strconv"
)

type Config struct {
	GRPCPort        string
	HTTPPort        string
	PostgresDSN     string
	RedisAddr       string
	RedisPassword   string
	NatsURL         string
	WalletAddr      string
	BettingSeconds  int
	TickIntervalMs  int
}

func Load() *Config {
	return &Config{
		GRPCPort:       getEnv("AVIATOR_SERVICE_GRPC_PORT", "50054"),
		HTTPPort:       getEnv("AVIATOR_SERVICE_HTTP_PORT", "8054"),
		PostgresDSN:    buildPostgresDSN(),
		RedisAddr:      getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPassword:  readSecret("REDIS_PASSWORD"),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		WalletAddr:     getEnv("WALLET_SERVICE_HOST", "localhost") + ":" + getEnv("WALLET_SERVICE_GRPC_PORT", "50052"),
		BettingSeconds: getEnvInt("AVIATOR_BETTING_SECONDS", 5),
		TickIntervalMs: getEnvInt("AVIATOR_TICK_MS", 100),
	}
}

func buildPostgresDSN() string {
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := readSecret("POSTGRES_USER")
	pass := readSecret("POSTGRES_PASSWORD")
	db := getEnv("POSTGRES_DB", "akadilxbet_db")
	return "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + db + "?sslmode=disable"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
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
