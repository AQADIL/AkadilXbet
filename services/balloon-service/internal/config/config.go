package config

import "os"

type Config struct {
	GRPCPort   string
	HTTPPort   string
	PostgresDSN string
	RedisAddr  string
	RedisPassword string
	NatsURL    string
	MinBetCents int64
	MaxBetCents int64
}

func Load() *Config {
	return &Config{
		GRPCPort:      getEnv("BALLOON_SERVICE_GRPC_PORT", "50055"),
		HTTPPort:      getEnv("BALLOON_SERVICE_HTTP_PORT", "8055"),
		PostgresDSN:   buildPostgresDSN(),
		RedisAddr:     getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPassword: readSecret("REDIS_PASSWORD"),
		NatsURL:       getEnv("NATS_URL", "nats://localhost:4222"),
		MinBetCents:   100,
		MaxBetCents:   50_000,
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
