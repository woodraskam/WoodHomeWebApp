package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the WoodHome WebApp
type Config struct {
	// Server Configuration
	Port         string
	APIBaseURL   string
	
	// Database Configuration
	Database DatabaseConfig
	
	// Email Configuration
	Email EmailConfig
	
	// External Services
	Sonos SonosConfig
	Hue   HueConfig
	
	// Logging Configuration
	Logging LoggingConfig
}

// DatabaseConfig holds database connection settings
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
	Timeout  time.Duration
}

// EmailConfig holds email service settings
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	FromEmail    string
	FromPassword string
}

// SonosConfig holds Sonos service settings
type SonosConfig struct {
	APIURL   string
	Timeout  time.Duration
	RetryCount int
}

// HueConfig holds Hue lighting service settings
type HueConfig struct {
	BridgeIP    string
	Username    string
	Timeout     time.Duration
	RetryCount  int
}

// LoggingConfig holds logging settings
type LoggingConfig struct {
	Level      string
	LogFile    string
	MaxSize    int
	MaxBackups int
	MaxAge     int
}

// Load loads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Port:       getEnv("PORT", "3000"),
		APIBaseURL:  getEnv("API_BASE_URL", "http://localhost:8080"),
		
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 1433),
			User:     getEnv("DB_USER", ""),
			Password: getEnv("DB_PASSWORD", ""),
			Database: getEnv("DB_NAME", "woodhome"),
			Timeout:  time.Duration(getEnvAsInt("DB_TIMEOUT", 30)) * time.Second,
		},
		
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
			FromEmail:    getEnv("FROM_EMAIL", ""),
			FromPassword: getEnv("FROM_PASSWORD", ""),
		},
		
		Sonos: SonosConfig{
			APIURL:     getEnv("SONOS_API_URL", "http://localhost:5005"),
			Timeout:    time.Duration(getEnvAsInt("SONOS_TIMEOUT", 30)) * time.Second,
			RetryCount: getEnvAsInt("SONOS_RETRY_COUNT", 3),
		},
		
		Hue: HueConfig{
			BridgeIP:   getEnv("HUE_BRIDGE_IP", ""),
			Username:   getEnv("HUE_USERNAME", ""),
			Timeout:    time.Duration(getEnvAsInt("HUE_TIMEOUT", 30)) * time.Second,
			RetryCount: getEnvAsInt("HUE_RETRY_COUNT", 3),
		},
		
		Logging: LoggingConfig{
			Level:      getEnv("LOG_LEVEL", "info"),
			LogFile:    getEnv("LOG_FILE", "woodhome.log"),
			MaxSize:    getEnvAsInt("LOG_MAX_SIZE", 100),
			MaxBackups: getEnvAsInt("LOG_MAX_BACKUPS", 3),
			MaxAge:     getEnvAsInt("LOG_MAX_AGE", 28),
		},
	}
}

// Validate checks if all required configuration is present
func (c *Config) Validate() error {
	// Add validation logic here
	// For now, just return nil
	return nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
