package config

import "os"

type Config struct {
	Port            string
	PostgresDSN     string
	NatsURL         string
	VAPIDPublicKey  string
	VAPIDPrivateKey string
	Subject         string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PUSH_SERVICE_PORT", "8086"),
		PostgresDSN:     buildPostgresDSN(),
		NatsURL:         getEnv("NATS_URL", "nats://localhost:4222"),
		VAPIDPublicKey:  getEnv("VAPID_PUBLIC_KEY", ""),
		VAPIDPrivateKey: getEnv("VAPID_PRIVATE_KEY", ""),
		Subject:         getEnv("VAPID_SUBJECT", "mailto:admin@akadilxbet.com"),
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
