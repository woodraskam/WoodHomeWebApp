package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type WoodHomeConfig struct {
	APIBaseURL string
	Port       string
}

// Cribbage database models
type CribbageDB struct {
	db *sql.DB
}

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
var cribbageDB *CribbageDB

func main() {
	// Configuration
	config.APIBaseURL = getEnv("WOODHOME_API_URL", "http://localhost:8080")
	config.Port = getEnv("PORT", "3000")

	// Initialize database
	var err error
	cribbageDB, err = initDatabase()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer cribbageDB.db.Close()

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

	// Existing routes
	http.HandleFunc("/play/CandyLand", candyLandHandler)
	http.HandleFunc("/play/Candyland", candyLandHandler) // Handle lowercase variation
	http.HandleFunc("/candyland", candyLandHandler)      // Keep simple path as backup
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
	log.Printf("  GET /games/CandyLand")
	log.Printf("  GET /games/Candyland")
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

// Database initialization
func initDatabase() (*CribbageDB, error) {
	db, err := sql.Open("sqlite3", "./cribbage.db")
	if err != nil {
		return nil, err
	}

	// Read and execute schema
	schema, err := os.ReadFile("database/cribbage_schema.sql")
	if err != nil {
		return nil, fmt.Errorf("failed to read schema file: %v", err)
	}

	_, err = db.Exec(string(schema))
	if err != nil {
		return nil, fmt.Errorf("failed to execute schema: %v", err)
	}

	return &CribbageDB{db: db}, nil
}

// Cribbage database operations
func (c *CribbageDB) CreateGame(player1Email string) (*Game, error) {
	gameID := generateGameID()
	game := &Game{
		ID:           gameID,
		Player1Email: player1Email,
		Status:       "waiting",
		CurrentPhase: "waiting",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err := c.db.Exec(`
		INSERT INTO games (id, player1_email, status, current_phase, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, game.ID, game.Player1Email, game.Status, game.CurrentPhase, game.CreatedAt, game.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return game, nil
}

func (c *CribbageDB) JoinGame(gameID, player2Email string) error {
	_, err := c.db.Exec(`
		UPDATE games 
		SET player2_email = ?, status = 'active', current_phase = 'deal', updated_at = ?
		WHERE id = ? AND player2_email IS NULL
	`, player2Email, time.Now(), gameID)

	if err != nil {
		return err
	}

	// Check if the update affected any rows
	result, err := c.db.Exec(`
		UPDATE games 
		SET player2_email = ?, status = 'active', current_phase = 'deal', updated_at = ?
		WHERE id = ? AND player2_email IS NULL
	`, player2Email, time.Now(), gameID)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("game not found or already has two players")
	}

	return nil
}

func (c *CribbageDB) GetGame(gameID string) (*Game, error) {
	game := &Game{}
	err := c.db.QueryRow(`
		SELECT id, player1_email, player2_email, status, player1_score, player2_score,
		       current_phase, current_player, game_data, created_at, updated_at
		FROM games WHERE id = ?
	`, gameID).Scan(
		&game.ID, &game.Player1Email, &game.Player2Email, &game.Status,
		&game.Player1Score, &game.Player2Score, &game.CurrentPhase,
		&game.CurrentPlayer, &game.GameData, &game.CreatedAt, &game.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return game, nil
}

func (c *CribbageDB) CreateToken(gameID, userEmail string) (string, error) {
	token := generateToken()
	expiresAt := time.Now().Add(24 * time.Hour) // Token expires in 24 hours

	_, err := c.db.Exec(`
		INSERT INTO game_tokens (token, game_id, user_email, expires_at, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, token, gameID, userEmail, expiresAt, time.Now())

	if err != nil {
		return "", err
	}

	return token, nil
}

func (c *CribbageDB) ValidateToken(token string) (*GameToken, error) {
	gameToken := &GameToken{}
	err := c.db.QueryRow(`
		SELECT token, game_id, user_email, expires_at, created_at
		FROM game_tokens WHERE token = ? AND expires_at > ?
	`, token, time.Now()).Scan(
		&gameToken.Token, &gameToken.GameID, &gameToken.UserEmail,
		&gameToken.ExpiresAt, &gameToken.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return gameToken, nil
}

func (c *CribbageDB) UpdateGameState(gameID string, updates map[string]interface{}) error {
	setParts := []string{}
	args := []interface{}{}

	for key, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = ?", key))
		args = append(args, value)
	}

	args = append(args, time.Now(), gameID)

	query := fmt.Sprintf("UPDATE games SET %s, updated_at = ? WHERE id = ?", strings.Join(setParts, ", "))
	_, err := c.db.Exec(query, args...)

	return err
}

// Cribbage handler functions
func cribbageHomeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	tmpl := template.Must(template.ParseFiles("templates/cribbage-home.html"))

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
	game, err := cribbageDB.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	tmpl := template.Must(template.ParseFiles("templates/cribbage-board.html"))

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
	game, err := cribbageDB.GetGame(gameID)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	tmpl := template.Must(template.ParseFiles("templates/cribbage-controller.html"))

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

	game, err := cribbageDB.CreateGame(request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to create game", http.StatusInternalServerError)
		return
	}

	token, err := cribbageDB.CreateToken(game.ID, request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
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

	err := cribbageDB.JoinGame(request.GameID, request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to join game: "+err.Error(), http.StatusBadRequest)
		return
	}

	token, err := cribbageDB.CreateToken(request.GameID, request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
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
	game, err := cribbageDB.GetGame(request.GameID)
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

	game, err := cribbageDB.GetGame(gameID)
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

// Utility functions
func generateGameID() string {
	return fmt.Sprintf("game_%d", time.Now().UnixNano())
}

func generateToken() string {
	return fmt.Sprintf("token_%d", time.Now().UnixNano())
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
