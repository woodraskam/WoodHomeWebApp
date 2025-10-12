package main

import (
	"log"

	"woodhome-webapp/internal/config"
	"woodhome-webapp/internal/database"
	"woodhome-webapp/internal/server"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Load configuration
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Configuration validation failed: %v", err)
	}

	// Initialize database
	dbConfig := database.DatabaseConfig{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		Database: cfg.Database.Database,
		Timeout:  cfg.Database.Timeout,
	}
	db, err := database.New(dbConfig)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize server
	srv := server.New(cfg, db)
	srv.SetupRoutes()

	// Start server
	if err := srv.Run(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
