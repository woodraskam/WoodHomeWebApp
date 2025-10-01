package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"woodhome-webapp/internal/handlers"
	"woodhome-webapp/internal/models"
	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/microsoft/go-mssqldb"
	"gopkg.in/gomail.v2"
)

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type WoodHomeConfig struct {
	APIBaseURL   string
	Port         string
	SMTPHost     string
	SMTPPort     int
	FromEmail    string
	FromPassword string
}

// Database connection
var db *sql.DB

// Cribbage game management
type CribbageGameManager struct {
	db *sql.DB
}

// Email service for cribbage notifications
type EmailService struct {
	smtpHost     string
	smtpPort     int
	fromEmail    string
	fromPassword string
}

// Card structure for cribbage
type Card struct {
	ID        string `json:"id"`
	Suit      string `json:"suit"`
	Value     string `json:"value"`
	PlayValue int    `json:"playValue"`
}

// Game state for cribbage
type CribbageGameState struct {
	GameID        string    `json:"gameId"`
	Player1Email  string    `json:"player1Email"`
	Player2Email  string    `json:"player2Email"`
	Status        string    `json:"status"`
	Player1Score  int       `json:"player1Score"`
	Player2Score  int       `json:"player2Score"`
	CurrentPhase  string    `json:"currentPhase"`
	CurrentPlayer string    `json:"currentPlayer"`
	Player1Hand   []Card    `json:"player1Hand"`
	Player2Hand   []Card    `json:"player2Hand"`
	Crib          []Card    `json:"crib"`
	PlayedCards   []Card    `json:"playedCards"`
	CurrentTotal  int       `json:"currentTotal"`
	CutCard       Card      `json:"cutCard"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Cribbage API client
type CribbageAPIClient struct {
	baseURL string
	client  *http.Client
}

// Cribbage data models (for API communication)
type Game struct {
	ID            string    `json:"id"`
	Player1Email  string    `json:"player1_email"`
	Player2Email  string    `json:"player2_email"`
	Status        string    `json:"status"`
	Player1Score  int       `json:"player1_score"`
	Player2Score  int       `json:"player2_score"`
	CurrentPhase  string    `json:"current_phase"`
	CurrentPlayer string    `json:"current_player"`
	GameData      string    `json:"game_data"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type GameToken struct {
	Token     string    `json:"token"`
	GameID    string    `json:"game_id"`
	UserEmail string    `json:"user_email"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type GameMove struct {
	ID          int       `json:"id"`
	GameID      string    `json:"game_id"`
	PlayerEmail string    `json:"player_email"`
	MoveType    string    `json:"move_type"`
	MoveData    string    `json:"move_data"`
	CreatedAt   time.Time `json:"created_at"`
}

type GameUpdate struct {
	ID         int       `json:"id"`
	GameID     string    `json:"game_id"`
	UpdateType string    `json:"update_type"`
	UpdateData string    `json:"update_data"`
	CreatedAt  time.Time `json:"created_at"`
}

var config WoodHomeConfig
var cribbageManager *CribbageGameManager
var emailService *EmailService
var sonosService *services.SonosService
var sonosHandler *handlers.SonosHandler

// Initialize database
func initDatabase() error {
	var err error

	// SQL Server connection string with trusted connection
	// You can customize these values via environment variables
	server := getEnv("DB_SERVER", "localhost")
	port := getEnv("DB_PORT", "1433")
	database := getEnv("DB_NAME", "WoodHome")
	useTrustedConnection := getEnv("DB_TRUSTED_CONNECTION", "true")

	// First connect to master database to create WoodHome database if it doesn't exist
	masterConnStr := fmt.Sprintf("server=%s;port=%s;database=master;trusted_connection=%s;encrypt=disable;trustservercertificate=true",
		server, port, useTrustedConnection)

	masterDb, err := sql.Open("sqlserver", masterConnStr)
	if err != nil {
		return err
	}

	// Test master connection
	if err = masterDb.Ping(); err != nil {
		return err
	}

	// Create WoodHome database if it doesn't exist
	_, err = masterDb.Exec(fmt.Sprintf("IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '%s') CREATE DATABASE [%s]", database, database))
	if err != nil {
		return err
	}

	// Close master connection
	masterDb.Close()

	// Now connect to WoodHome database
	connStr := fmt.Sprintf("server=%s;port=%s;database=%s;trusted_connection=%s;encrypt=disable;trustservercertificate=true",
		server, port, database, useTrustedConnection)

	db, err = sql.Open("sqlserver", connStr)
	if err != nil {
		return err
	}

	// Test connection
	if err = db.Ping(); err != nil {
		return err
	}

	// Create cribbage tables
	_, err = db.Exec(`
		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cribbage_games' AND xtype='U')
		CREATE TABLE cribbage_games (
			id NVARCHAR(255) PRIMARY KEY,
			player1_email NVARCHAR(255) NOT NULL,
			player2_email NVARCHAR(255),
			status NVARCHAR(50) NOT NULL DEFAULT 'waiting',
			player1_score INT DEFAULT 0,
			player2_score INT DEFAULT 0,
			current_phase NVARCHAR(50) DEFAULT 'waiting',
			current_player NVARCHAR(255),
			game_data NTEXT,
			created_at DATETIME2 DEFAULT GETDATE(),
			updated_at DATETIME2 DEFAULT GETDATE()
		);

		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cribbage_game_tokens' AND xtype='U')
		CREATE TABLE cribbage_game_tokens (
			token NVARCHAR(255) PRIMARY KEY,
			game_id NVARCHAR(255) NOT NULL,
			user_email NVARCHAR(255) NOT NULL,
			expires_at DATETIME2 NOT NULL,
			created_at DATETIME2 DEFAULT GETDATE(),
			FOREIGN KEY (game_id) REFERENCES cribbage_games (id) ON DELETE CASCADE
		);

		IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cribbage_game_moves' AND xtype='U')
		CREATE TABLE cribbage_game_moves (
			id INT IDENTITY(1,1) PRIMARY KEY,
			game_id NVARCHAR(255) NOT NULL,
			player_email NVARCHAR(255) NOT NULL,
			move_type NVARCHAR(50) NOT NULL,
			move_data NTEXT,
			created_at DATETIME2 DEFAULT GETDATE(),
			FOREIGN KEY (game_id) REFERENCES cribbage_games (id) ON DELETE CASCADE
		);
	`)

	return err
}

// Cribbage game manager methods
func (c *CribbageGameManager) CreateGame(player1Email string) (*Game, error) {
	gameID := generateGameID()
	now := time.Now()

	log.Printf("Creating game with ID: %s for player: %s", gameID, player1Email)

	_, err := c.db.Exec(`
		INSERT INTO cribbage_games (id, player1_email, status, current_phase, created_at, updated_at)
		VALUES (@p1, @p2, 'waiting', 'waiting', @p3, @p4)
	`, gameID, player1Email, now, now)

	if err != nil {
		log.Printf("CreateGame error: %v", err)
		return nil, err
	}

	log.Printf("Game created successfully: %s", gameID)

	game := &Game{
		ID:           gameID,
		Player1Email: player1Email,
		Status:       "waiting",
		CurrentPhase: "waiting",
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	return game, nil
}

func (c *CribbageGameManager) JoinGame(gameID, player2Email string) error {
	_, err := c.db.Exec(`
		UPDATE cribbage_games 
		SET player2_email = @p1, status = 'active', current_phase = 'deal', updated_at = @p2
		WHERE id = @p3 AND player2_email IS NULL
	`, player2Email, time.Now(), gameID)

	return err
}

func (c *CribbageGameManager) GetGame(gameID string) (*Game, error) {
	log.Printf("GetGame called with gameID: %s", gameID)

	var game Game
	var player2Email sql.NullString
	var player1Score, player2Score sql.NullInt32
	var currentPhase, currentPlayer, gameData sql.NullString

	err := c.db.QueryRow(`
		SELECT id, player1_email, player2_email, status, player1_score, player2_score,
		       current_phase, current_player, game_data, created_at, updated_at
		FROM cribbage_games WHERE id = @p1
	`, gameID).Scan(
		&game.ID, &game.Player1Email, &player2Email, &game.Status,
		&player1Score, &player2Score, &currentPhase,
		&currentPlayer, &gameData, &game.CreatedAt, &game.UpdatedAt,
	)

	if err != nil {
		log.Printf("GetGame error for %s: %v", gameID, err)
		return nil, err
	}

	// Handle NULL values
	if player2Email.Valid {
		game.Player2Email = player2Email.String
	}
	if player1Score.Valid {
		game.Player1Score = int(player1Score.Int32)
	}
	if player2Score.Valid {
		game.Player2Score = int(player2Score.Int32)
	}
	if currentPhase.Valid {
		game.CurrentPhase = currentPhase.String
	}
	if currentPlayer.Valid {
		game.CurrentPlayer = currentPlayer.String
	}
	if gameData.Valid {
		game.GameData = gameData.String
	}

	log.Printf("GetGame success for %s: %+v", gameID, game)

	return &game, nil
}

func (c *CribbageGameManager) UpdateGameState(gameID string, updates map[string]interface{}) error {
	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}

	for key, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = ?", key))
		args = append(args, value)
	}

	args = append(args, time.Now(), gameID)
	query := fmt.Sprintf("UPDATE cribbage_games SET %s, updated_at = ? WHERE id = ?", strings.Join(setParts, ", "))

	_, err := c.db.Exec(query, args...)
	return err
}

func (c *CribbageGameManager) CreateToken(gameID, userEmail string) (string, error) {
	token := generateToken()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err := c.db.Exec(`
		INSERT INTO cribbage_game_tokens (token, game_id, user_email, expires_at)
		VALUES (@p1, @p2, @p3, @p4)
	`, token, gameID, userEmail, expiresAt)

	if err != nil {
		return "", err
	}

	return token, nil
}

func (c *CribbageGameManager) ValidateToken(token string) (*GameToken, error) {
	var gameToken GameToken
	err := c.db.QueryRow(`
		SELECT token, game_id, user_email, expires_at, created_at
		FROM cribbage_game_tokens WHERE token = @p1 AND expires_at > @p2
	`, token, time.Now()).Scan(
		&gameToken.Token, &gameToken.GameID, &gameToken.UserEmail,
		&gameToken.ExpiresAt, &gameToken.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &gameToken, nil
}

// Email service methods
func (e *EmailService) SendGameInvitation(gameID, player1Email, player2Email string) error {
	subject := "Cribbage Game Invitation"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>You've been invited to a Cribbage game!</h2>
			<p>Hello,</p>
			<p>%s has invited you to play a game of Cribbage.</p>
			<p><strong>Game ID:</strong> %s</p>
			<p>Click the link below to join the game:</p>
			<p><a href="http://localhost:3000/play/cribbage?gameId=%s&playerEmail=%s">Join Game</a></p>
			<p>Good luck and have fun!</p>
		</body>
		</html>
	`, player1Email, gameID, gameID, player2Email)

	return e.sendEmail(player2Email, subject, body)
}

func (e *EmailService) SendGameUpdate(gameID, playerEmail, updateType, message string) error {
	subject := "Cribbage Game Update"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Cribbage Game Update</h2>
			<p>Hello,</p>
			<p>%s</p>
			<p><strong>Game ID:</strong> %s</p>
			<p>Click the link below to view the game:</p>
			<p><a href="http://localhost:3000/play/WoodraskaCribbage/board/?gameId=%s&playerEmail=%s">View Game</a></p>
		</body>
		</html>
	`, message, gameID, gameID, playerEmail)

	return e.sendEmail(playerEmail, subject, body)
}

func (e *EmailService) SendGameEndNotification(gameID, playerEmail, winner string, finalScore string) error {
	subject := "Cribbage Game Finished"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Cribbage Game Finished</h2>
			<p>Hello,</p>
			<p>The cribbage game has ended!</p>
			<p><strong>Winner:</strong> %s</p>
			<p><strong>Final Score:</strong> %s</p>
			<p><strong>Game ID:</strong> %s</p>
			<p>Thanks for playing!</p>
		</body>
		</html>
	`, winner, finalScore, gameID)

	return e.sendEmail(playerEmail, subject, body)
}

func (e *EmailService) sendEmail(to, subject, body string) error {
	// Log email attempt for debugging
	log.Printf("Attempting to send email to: %s", to)
	log.Printf("SMTP Host: %s, Port: %d", e.smtpHost, e.smtpPort)
	log.Printf("From Email: %s", e.fromEmail)

	m := gomail.NewMessage()
	m.SetHeader("From", e.fromEmail)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(e.smtpHost, e.smtpPort, e.fromEmail, e.fromPassword)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Email send failed: %v", err)
		return err
	}

	log.Printf("Email sent successfully to: %s", to)
	return nil
}

// Utility functions
func generateGameID() string {
	return fmt.Sprintf("game_%d", time.Now().UnixNano())
}

func generateToken() string {
	return fmt.Sprintf("token_%d", time.Now().UnixNano())
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Set up file logging
	logFile, err := os.OpenFile("woodhome.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer logFile.Close()

	// Create multi-writer to log to both file and console
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)

	// Initialize database
	err = initDatabase()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize cribbage game manager
	cribbageManager = &CribbageGameManager{db: db}

	// Initialize Sonos service
	sonosConfig := &models.SonosServiceConfig{
		JishiURL:     getEnv("SONOS_JISHI_URL", "http://localhost:5005"),
		Timeout:      30 * time.Second,
		RetryCount:   3,
		PollInterval: 5 * time.Second,
	}
	sonosService = services.NewSonosService(sonosConfig)
	sonosHandler = handlers.NewSonosHandler(sonosService)

	// Start Sonos service
	ctx := context.Background()
	if err := sonosService.Start(ctx); err != nil {
		log.Printf("Warning: Failed to start Sonos service: %v", err)
	}

	// Configuration
	config.APIBaseURL = getEnv("WOODHOME_API_URL", "http://localhost:8080")
	config.Port = getEnv("PORT", "3000")
	config.SMTPHost = getEnv("SMTP_HOST", "smtp.gmail.com")
	config.SMTPPort, _ = strconv.Atoi(getEnv("SMTP_PORT", "587"))
	config.FromEmail = getEnv("FROM_EMAIL", "")
	config.FromPassword = getEnv("FROM_PASSWORD", "")

	// Initialize email service
	emailService = &EmailService{
		smtpHost:     config.SMTPHost,
		smtpPort:     config.SMTPPort,
		fromEmail:    config.FromEmail,
		fromPassword: config.FromPassword,
	}

	// Log email configuration for debugging
	log.Printf("Email configuration loaded:")
	log.Printf("  SMTP Host: %s", config.SMTPHost)
	log.Printf("  SMTP Port: %d", config.SMTPPort)
	log.Printf("  From Email: %s", config.FromEmail)
	log.Printf("  Password length: %d characters", len(config.FromPassword))

	// cribbageManager is already initialized in initDatabase()

	// Setup routes using standard http package for testing
	// Register specific routes first (most specific to least specific)

	// Cribbage routes (most specific first)
	http.HandleFunc("/play/WoodraskaCribbage/board/", cribbageBoardHandler)
	http.HandleFunc("/play/WoodraskaCribbage/player/", cribbagePlayerHandler)
	http.HandleFunc("/play/cribbage", cribbageHomeHandler)
	http.HandleFunc("/cribbage", cribbageHomeHandler) // simple fallback

	// Cribbage API routes
	http.HandleFunc("/api/cribbage/create", createGameHandler)
	http.HandleFunc("/api/cribbage/join", joinGameHandler)
	http.HandleFunc("/api/cribbage/play", playCardHandler)
	http.HandleFunc("/api/cribbage/state", gameStateHandler)
	http.HandleFunc("/api/cribbage/updates", gameUpdatesHandler)

	// Sonos routes
	http.HandleFunc("/sonos", sonosDashboardHandler)
	http.HandleFunc("/ws/sonos", sonosWebSocketHandler)
	
	// Sonos API routes (using mux for better routing)
	router := mux.NewRouter()
	sonosHandler.RegisterRoutes(router)
	http.Handle("/api/sonos/", router)

	// Existing routes
	http.HandleFunc("/play/CandyLand", candyLandHandler)
	http.HandleFunc("/play/Candyland", candyLandHandler) // Handle lowercase variation
	http.HandleFunc("/candyland", candyLandHandler)      // Keep simple path as backup
	http.HandleFunc("/play/TicTacToe", ticTacToeHandler)
	http.HandleFunc("/play/tictactoe", ticTacToeHandler) // Handle lowercase variation
	http.HandleFunc("/tictactoe", ticTacToeHandler)      // Keep simple path as backup
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Test route called for path: %s", r.URL.Path)
		w.Write([]byte("Test route is working!"))
	})
	http.HandleFunc("/api/health", healthCheckHandler)
	http.HandleFunc("/api/connectivity", connectivityTestHandler)

	// Static files (register before catch-all)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	// Root handler last (catch-all)
	http.HandleFunc("/", homeHandler)

	log.Printf("Routes registered:")
	log.Printf("  GET /play/CandyLand")
	log.Printf("  GET /play/Candyland")
	log.Printf("  GET /candyland")
	log.Printf("  GET /play/TicTacToe")
	log.Printf("  GET /play/tictactoe")
	log.Printf("  GET /tictactoe")
	log.Printf("  GET /api/health")
	log.Printf("  GET /api/connectivity")
	log.Printf("  GET / (catch-all)")

	log.Printf("Starting WoodHome WebApp on port %s", config.Port)
	log.Printf("WoodHome API URL: %s", config.APIBaseURL)

	if err := http.ListenAndServe(":"+config.Port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	tmpl := template.Must(template.ParseFiles("templates/index.html"))

	data := map[string]interface{}{
		"Title":       "WoodHome Dashboard",
		"APIBaseURL":  config.APIBaseURL,
		"CurrentTime": time.Now().Format("2006-01-02 15:04:05"),
	}

	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func candyLandHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("CandyLand handler called for path: %s", r.URL.Path)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Try to parse the template with error handling
	tmpl, err := template.ParseFiles("templates/candyland.html")
	if err != nil {
		log.Printf("Template parsing error: %v", err)
		http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "CandyLand Adventure - Mark Woodraska",
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("Template execution error: %v", err)
		http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("CandyLand template executed successfully")
}

func ticTacToeHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("TicTacToe handler called for path: %s", r.URL.Path)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Try to parse the template with error handling
	tmpl, err := template.ParseFiles("templates/tictactoe.html")
	if err != nil {
		log.Printf("Template parsing error: %v", err)
		http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "Tic Tac Toe - Mark Woodraska",
	}

	// Execute the template with error handling
	err = tmpl.Execute(w, data)
	if err != nil {
		log.Printf("Template execution error: %v", err)
		http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("TicTacToe template executed successfully")
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := APIResponse{
		Status:  "success",
		Message: "WoodHome WebApp is running",
		Data: map[string]interface{}{
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
		},
	}
	json.NewEncoder(w).Encode(response)
}

func connectivityTestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Test connection to WoodHome API
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(config.APIBaseURL + "/health")

	var response APIResponse
	if err != nil {
		response = APIResponse{
			Status:  "error",
			Message: "Failed to connect to WoodHome API: " + err.Error(),
		}
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			response = APIResponse{
				Status:  "success",
				Message: "Successfully connected to WoodHome API",
				Data: map[string]interface{}{
					"api_url":     config.APIBaseURL,
					"status_code": resp.StatusCode,
				},
			}
		} else {
			response = APIResponse{
				Status:  "warning",
				Message: fmt.Sprintf("WoodHome API responded with status %d", resp.StatusCode),
				Data: map[string]interface{}{
					"api_url":     config.APIBaseURL,
					"status_code": resp.StatusCode,
				},
			}
		}
	}

	json.NewEncoder(w).Encode(response)
}

func proxyToWoodHomeAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["path"]

	// Build the target URL
	targetURL := config.APIBaseURL + "/" + path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	// Create the request
	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy headers
	for key, values := range r.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Make the request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to connect to API: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	io.Copy(w, resp.Body)
}

// Cribbage API client methods
func (c *CribbageAPIClient) CreateGame(player1Email string) (*Game, error) {
	requestData := map[string]string{
		"playerEmail": player1Email,
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Post(c.baseURL+"/api/cribbage/create", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResponse APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, err
	}

	if apiResponse.Status != "success" {
		return nil, fmt.Errorf("API error: %s", apiResponse.Message)
	}

	// Extract game data from response
	gameData, ok := apiResponse.Data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format")
	}

	game := &Game{
		ID:           gameData["gameId"].(string),
		Player1Email: gameData["playerEmail"].(string),
		Status:       "waiting",
		CurrentPhase: "waiting",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	return game, nil
}

func (c *CribbageAPIClient) JoinGame(gameID, player2Email string) error {
	requestData := map[string]string{
		"gameId":      gameID,
		"playerEmail": player2Email,
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return err
	}

	resp, err := c.client.Post(c.baseURL+"/api/cribbage/join", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var apiResponse APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return err
	}

	if apiResponse.Status != "success" {
		return fmt.Errorf("API error: %s", apiResponse.Message)
	}

	return nil
}

func (c *CribbageAPIClient) GetGame(gameID string) (*Game, error) {
	resp, err := c.client.Get(fmt.Sprintf("%s/api/cribbage/state?gameId=%s", c.baseURL, gameID))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResponse APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, err
	}

	if apiResponse.Status != "success" {
		return nil, fmt.Errorf("API error: %s", apiResponse.Message)
	}

	// Convert response data to Game struct
	gameData, ok := apiResponse.Data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid response format")
	}

	game := &Game{
		ID:            gameData["id"].(string),
		Player1Email:  gameData["player1_email"].(string),
		Player2Email:  gameData["player2_email"].(string),
		Status:        gameData["status"].(string),
		Player1Score:  int(gameData["player1_score"].(float64)),
		Player2Score:  int(gameData["player2_score"].(float64)),
		CurrentPhase:  gameData["current_phase"].(string),
		CurrentPlayer: gameData["current_player"].(string),
		GameData:      gameData["game_data"].(string),
		CreatedAt:     time.Now(), // API should provide this
		UpdatedAt:     time.Now(), // API should provide this
	}

	return game, nil
}

func (c *CribbageAPIClient) CreateToken(gameID, userEmail string) (string, error) {
	// For now, generate a simple token
	// In a real implementation, this would call the API
	return generateToken(), nil
}

func (c *CribbageAPIClient) ValidateToken(token string) (*GameToken, error) {
	// For now, always return a valid token
	// In a real implementation, this would call the API
	return &GameToken{
		Token:     token,
		GameID:    "game_123",
		UserEmail: "player@example.com",
		ExpiresAt: time.Now().Add(24 * time.Hour),
		CreatedAt: time.Now(),
	}, nil
}

func (c *CribbageAPIClient) UpdateGameState(gameID string, updates map[string]interface{}) error {
	// This would call the API to update game state
	// For now, just return success
	return nil
}

// Cribbage handler functions
func cribbageHomeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Create template with custom functions
	tmpl := template.Must(template.New("cribbage-home.html").Funcs(template.FuncMap{
		"lower":      strings.ToLower,
		"suitSymbol": getSuitSymbol,
		"colorClass": getColorClass,
	}).ParseFiles("templates/cribbage-home.html"))

	data := map[string]interface{}{
		"Title": "Woodraska Cribbage - WoodHome",
	}

	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func cribbageBoardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Get game ID and player email from query parameters
	gameID := r.URL.Query().Get("gameId")
	playerEmail := r.URL.Query().Get("playerEmail")

	if gameID == "" || playerEmail == "" {
		http.Error(w, "Missing gameId or playerEmail parameter", http.StatusBadRequest)
		return
	}

	// Get game data
	game, err := cribbageManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Create template with custom functions
	tmpl := template.Must(template.New("cribbage-board.html").Funcs(template.FuncMap{
		"lower":      strings.ToLower,
		"suitSymbol": getSuitSymbol,
		"colorClass": getColorClass,
	}).ParseFiles("templates/cribbage-board.html"))

	// Create sample card data for display
	player1Hand := []map[string]interface{}{
		{"ID": "card1", "Suit": "HEARTS", "Value": "A"},
		{"ID": "card2", "Suit": "DIAMONDS", "Value": "K"},
		{"ID": "card3", "Suit": "CLUBS", "Value": "Q"},
		{"ID": "card4", "Suit": "SPADES", "Value": "J"},
		{"ID": "card5", "Suit": "HEARTS", "Value": "10"},
		{"ID": "card6", "Suit": "DIAMONDS", "Value": "9"},
	}

	player2Hand := []map[string]interface{}{
		{"ID": "card7", "Suit": "CLUBS", "Value": "8"},
		{"ID": "card8", "Suit": "SPADES", "Value": "7"},
		{"ID": "card9", "Suit": "HEARTS", "Value": "6"},
		{"ID": "card10", "Suit": "DIAMONDS", "Value": "5"},
		{"ID": "card11", "Suit": "CLUBS", "Value": "4"},
		{"ID": "card12", "Suit": "SPADES", "Value": "3"},
	}

	playedCards := []map[string]interface{}{
		{"ID": "played1", "Suit": "HEARTS", "Value": "2"},
		{"ID": "played2", "Suit": "DIAMONDS", "Value": "A"},
	}

	crib := []map[string]interface{}{
		{"ID": "crib1", "Suit": "CLUBS", "Value": "K"},
		{"ID": "crib2", "Suit": "SPADES", "Value": "Q"},
	}

	data := map[string]interface{}{
		"Title":         "Woodraska Cribbage - Game Board",
		"GameID":        game.ID,
		"PlayerEmail":   playerEmail,
		"Player1Email":  game.Player1Email,
		"Player2Email":  game.Player2Email,
		"CurrentPhase":  game.CurrentPhase,
		"Player1Score":  game.Player1Score,
		"Player2Score":  game.Player2Score,
		"GameStatus":    game.Status,
		"CurrentPlayer": game.CurrentPlayer,
		"Player1Hand":   player1Hand,
		"Player2Hand":   player2Hand,
		"PlayedCards":   playedCards,
		"Crib":          crib,
		"CurrentTotal":  15,
	}

	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func cribbagePlayerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Get game ID and player email from query parameters
	gameID := r.URL.Query().Get("gameId")
	playerEmail := r.URL.Query().Get("playerEmail")

	if gameID == "" || playerEmail == "" {
		http.Error(w, "Missing gameId or playerEmail parameter", http.StatusBadRequest)
		return
	}

	// Get game data
	game, err := cribbageManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Create template with custom functions
	tmpl := template.Must(template.New("cribbage-controller.html").Funcs(template.FuncMap{
		"lower":      strings.ToLower,
		"suitSymbol": getSuitSymbol,
		"colorClass": getColorClass,
	}).ParseFiles("templates/cribbage-controller.html"))

	// Determine player score and opponent score
	var playerScore, opponentScore int
	var isCurrentPlayer bool

	if playerEmail == game.Player1Email {
		playerScore = game.Player1Score
		opponentScore = game.Player2Score
		isCurrentPlayer = game.CurrentPlayer == game.Player1Email
	} else if playerEmail == game.Player2Email {
		playerScore = game.Player2Score
		opponentScore = game.Player1Score
		isCurrentPlayer = game.CurrentPlayer == game.Player2Email
	}

	// Create sample player hand data
	playerHand := []map[string]interface{}{
		{"ID": "card1", "Suit": "HEARTS", "Value": "A", "Playable": true},
		{"ID": "card2", "Suit": "DIAMONDS", "Value": "K", "Playable": true},
		{"ID": "card3", "Suit": "CLUBS", "Value": "Q", "Playable": true},
		{"ID": "card4", "Suit": "SPADES", "Value": "J", "Playable": true},
		{"ID": "card5", "Suit": "HEARTS", "Value": "10", "Playable": true},
		{"ID": "card6", "Suit": "DIAMONDS", "Value": "9", "Playable": true},
	}

	data := map[string]interface{}{
		"Title":           "Woodraska Cribbage - Player Controller",
		"GameID":          game.ID,
		"PlayerEmail":     playerEmail,
		"Player1Email":    game.Player1Email,
		"Player2Email":    game.Player2Email,
		"CurrentPhase":    game.CurrentPhase,
		"PlayerScore":     playerScore,
		"OpponentScore":   opponentScore,
		"TotalScore":      playerScore + opponentScore,
		"GameStatus":      game.Status,
		"IsCurrentPlayer": isCurrentPlayer,
		"StatusMessage":   getStatusMessage(game, playerEmail),
		"PlayerHand":      playerHand,
	}

	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// API handlers
func createGameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		PlayerEmail string `json:"playerEmail"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if request.PlayerEmail == "" {
		http.Error(w, "Player email is required", http.StatusBadRequest)
		return
	}

	game, err := cribbageManager.CreateGame(request.PlayerEmail)
	if err != nil {
		handleCribbageError(w, "create game", err, "", request.PlayerEmail)
		return
	}

	token, err := cribbageManager.CreateToken(game.ID, request.PlayerEmail)
	if err != nil {
		handleCribbageError(w, "create token", err, game.ID, request.PlayerEmail)
		return
	}

	response := APIResponse{
		Status:  "success",
		Message: "Game created successfully",
		Data: map[string]interface{}{
			"gameId":      game.ID,
			"playerEmail": request.PlayerEmail,
			"token":       token,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func joinGameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		GameID      string `json:"gameId"`
		PlayerEmail string `json:"playerEmail"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if request.GameID == "" || request.PlayerEmail == "" {
		http.Error(w, "Game ID and player email are required", http.StatusBadRequest)
		return
	}

	err := cribbageManager.JoinGame(request.GameID, request.PlayerEmail)
	if err != nil {
		handleCribbageError(w, "join game", err, request.GameID, request.PlayerEmail)
		return
	}

	token, err := cribbageManager.CreateToken(request.GameID, request.PlayerEmail)
	if err != nil {
		handleCribbageError(w, "create token", err, request.GameID, request.PlayerEmail)
		return
	}

	// Get game details for email notification
	game, err := cribbageManager.GetGame(request.GameID)
	if err == nil && game != nil {
		// Send email notification to both players
		go func() {
			// Notify player 1 that player 2 joined
			emailService.SendGameUpdate(request.GameID, game.Player1Email, "player_joined",
				fmt.Sprintf("Player %s has joined your cribbage game!", request.PlayerEmail))

			// Notify player 2 that they joined successfully
			emailService.SendGameUpdate(request.GameID, request.PlayerEmail, "game_started",
				fmt.Sprintf("You have successfully joined the cribbage game with %s!", game.Player1Email))
		}()
	}

	response := APIResponse{
		Status:  "success",
		Message: "Joined game successfully",
		Data: map[string]interface{}{
			"gameId":      request.GameID,
			"playerEmail": request.PlayerEmail,
			"token":       token,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func playCardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		GameID      string   `json:"gameId"`
		PlayerEmail string   `json:"playerEmail"`
		CardID      string   `json:"cardId,omitempty"`
		CardIDs     []string `json:"cardIds,omitempty"`
		Action      string   `json:"action"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate request
	if request.GameID == "" || request.PlayerEmail == "" || request.Action == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Get game to validate
	game, err := cribbageManager.GetGame(request.GameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Check if it's the player's turn
	if game.CurrentPlayer != request.PlayerEmail {
		http.Error(w, "Not your turn", http.StatusBadRequest)
		return
	}

	// Process the move based on action
	switch request.Action {
	case "play":
		if request.CardID == "" {
			http.Error(w, "Card ID required for play action", http.StatusBadRequest)
			return
		}
		// TODO: Implement card play logic
	case "discard":
		if len(request.CardIDs) != 2 {
			http.Error(w, "Exactly 2 cards required for discard", http.StatusBadRequest)
			return
		}
		// TODO: Implement discard logic
	case "count":
		// TODO: Implement count logic
	case "go":
		// TODO: Implement go logic
	default:
		http.Error(w, "Invalid action", http.StatusBadRequest)
		return
	}

	response := APIResponse{
		Status:  "success",
		Message: "Move processed successfully",
		Data: map[string]interface{}{
			"gameId": request.GameID,
			"action": request.Action,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func gameStateHandler(w http.ResponseWriter, r *http.Request) {
	gameID := r.URL.Query().Get("gameId")
	playerEmail := r.URL.Query().Get("playerEmail")

	if gameID == "" || playerEmail == "" {
		http.Error(w, "Missing gameId or playerEmail", http.StatusBadRequest)
		return
	}

	game, err := cribbageManager.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	response := APIResponse{
		Status:  "success",
		Message: "Game state retrieved",
		Data:    game,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func gameUpdatesHandler(w http.ResponseWriter, r *http.Request) {
	gameID := r.URL.Query().Get("gameId")
	playerEmail := r.URL.Query().Get("playerEmail")

	if gameID == "" || playerEmail == "" {
		http.Error(w, "Missing gameId or playerEmail", http.StatusBadRequest)
		return
	}

	// Set up Server-Sent Events
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Send initial connection message
	fmt.Fprintf(w, "data: {\"type\":\"connected\",\"message\":\"Connected to game updates\"}\n\n")
	w.(http.Flusher).Flush()

	// TODO: Implement real-time updates via SSE
	// For now, just send a heartbeat every 30 seconds
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			fmt.Fprintf(w, "data: {\"type\":\"heartbeat\",\"timestamp\":%d}\n\n", time.Now().Unix())
			w.(http.Flusher).Flush()
		case <-r.Context().Done():
			return
		}
	}
}

// Cribbage-specific error handling and logging
func logCribbageError(operation string, err error, gameID string, playerEmail string) {
	log.Printf("Cribbage Error - Operation: %s, GameID: %s, Player: %s, Error: %v",
		operation, gameID, playerEmail, err)
}

func handleCribbageError(w http.ResponseWriter, operation string, err error, gameID string, playerEmail string) {
	logCribbageError(operation, err, gameID, playerEmail)

	response := APIResponse{
		Status:  "error",
		Message: fmt.Sprintf("Cribbage %s failed: %v", operation, err),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(response)
}

func getStatusMessage(game *Game, playerEmail string) string {
	if game.Status == "finished" {
		return "Game Over!"
	}

	if game.Status == "waiting" {
		return "Waiting for another player to join..."
	}

	if game.CurrentPlayer != playerEmail {
		return "Waiting for opponent..."
	}

	switch game.CurrentPhase {
	case "discard":
		return "Select 2 cards to discard to the crib"
	case "play":
		return "Play a card or pass"
	case "count":
		return "Count your hand"
	default:
		return "Game in progress..."
	}
}

// Template helper functions
func getSuitSymbol(suit string) string {
	symbols := map[string]string{
		"HEARTS":   "♥",
		"DIAMONDS": "♦",
		"CLUBS":    "♣",
		"SPADES":   "♠",
	}
	return symbols[suit]
}

func getColorClass(suit string) string {
	if suit == "HEARTS" || suit == "DIAMONDS" {
		return "red"
	}
	return "black"
}

// Sonos handler functions
func sonosDashboardHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Sonos dashboard handler called for path: %s", r.URL.Path)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Try to parse the template with error handling
	tmpl, err := template.ParseFiles("templates/sonos/dashboard.html")
	if err != nil {
		log.Printf("Sonos template parsing error: %v", err)
		http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "Sonos Control - WoodHome",
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("Sonos template execution error: %v", err)
		http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("Sonos template executed successfully")
}

func sonosWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for now
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("Sonos WebSocket connection established")

	// Handle WebSocket messages
	for {
		var message map[string]interface{}
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		// Handle different message types
		switch message["type"] {
		case "ping":
			conn.WriteJSON(map[string]string{"type": "pong"})
		case "get_devices":
			devices := sonosService.GetDevices()
			conn.WriteJSON(map[string]interface{}{
				"type":    "device_list",
				"devices": devices,
			})
		case "get_groups":
			groups := sonosService.GetGroups()
			conn.WriteJSON(map[string]interface{}{
				"type":   "group_list",
				"groups": groups,
			})
		default:
			log.Printf("Unknown WebSocket message type: %v", message["type"])
		}
	}
}
