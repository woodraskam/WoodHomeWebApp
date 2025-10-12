package database

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/microsoft/go-mssqldb"
)

// DB wraps the database connection with additional functionality
type DB struct {
	*sql.DB
	config DatabaseConfig
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

// New creates a new database connection
func New(config DatabaseConfig) (*DB, error) {
	// Build connection string
	connStr := fmt.Sprintf("server=%s;port=%d;user id=%s;password=%s;database=%s;connection timeout=%d;",
		config.Host, config.Port, config.User, config.Password, config.Database, int(config.Timeout.Seconds()))

	// Open database connection
	sqlDB, err := sql.Open("sqlserver", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{
		DB:     sqlDB,
		config: config,
	}, nil
}

// Health checks if the database connection is healthy
func (db *DB) Health() error {
	return db.Ping()
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}
