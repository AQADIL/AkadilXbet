package config

import "os"

type Config struct {
	GRPCPort    string
	PostgresDSN string
	NatsURL     string
}

func Load() *Config {
	return &Config{
		GRPCPort:    getEnv("WALLET_SERVICE_GRPC_PORT", "50052"),
		PostgresDSN: buildPostgresDSN(),
		NatsURL:     getEnv("NATS_URL", "nats://localhost:4222"),
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
