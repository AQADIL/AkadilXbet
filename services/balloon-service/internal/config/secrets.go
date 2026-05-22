package config

import (
	"os"
	"strings"
)

func readSecret(envKey string) string {
	if fileKey := os.Getenv(envKey + "_FILE"); fileKey != "" {
		data, err := os.ReadFile(fileKey)
		if err == nil {
			return strings.TrimSpace(string(data))
		}
	}
	return os.Getenv(envKey)
}
