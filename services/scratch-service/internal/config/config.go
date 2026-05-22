package config

import "os"

type Config struct {
	Port        string
	PostgresDSN string
	JWTSecret   string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("SCRATCH_SERVICE_PORT", "8082"),
		PostgresDSN: buildDSN(),
		JWTSecret:   mustGetEnv("JWT_SECRET"),
	}
}

func buildDSN() string {
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
		panic("required env var not set: " + key)
	}
	return v
}
