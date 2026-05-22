package config

import (
	"os"
)

type Config struct {
	Port                string
	NatsURL             string
	PostgresDSN         string
	RedisAddr           string
	RedisPassword       string
	JWTSecret           string
	AuthServiceAddr     string
	AuthServiceHTTPAddr string
	ScratchServiceAddr  string
	SlotsServiceAddr    string
}

func Load() *Config {
	return &Config{
		Port:                getEnv("API_GATEWAY_PORT", "8080"),
		NatsURL:             getEnv("NATS_URL", "nats://localhost:4222"),
		PostgresDSN:         buildPostgresDSN(),
		RedisAddr:           getEnv("REDIS_HOST", "localhost") + ":" + getEnv("REDIS_PORT", "6379"),
		RedisPassword:       getEnv("REDIS_PASSWORD", ""),
		JWTSecret:           mustGetEnv("JWT_SECRET"),
		AuthServiceAddr:     getEnv("AUTH_SERVICE_HOST", "localhost") + ":" + getEnv("AUTH_SERVICE_GRPC_PORT", "50051"),
		AuthServiceHTTPAddr: getEnv("AUTH_SERVICE_HOST", "localhost") + ":" + getEnv("AUTH_SERVICE_HTTP_PORT", "8081"),
		ScratchServiceAddr:  getEnv("SCRATCH_SERVICE_HOST", "localhost") + ":" + getEnv("SCRATCH_SERVICE_PORT", "8082"),
		SlotsServiceAddr:    getEnv("SLOTS_SERVICE_HOST", "localhost") + ":" + getEnv("SLOTS_SERVICE_PORT", "8083"),
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
