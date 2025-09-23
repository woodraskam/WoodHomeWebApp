package main

import (
	"bytes"
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
var cribbageAPI *CribbageAPIClient

func main() {
	// Configuration
	config.APIBaseURL = getEnv("WOODHOME_API_URL", "http://localhost:8080")
	config.Port = getEnv("PORT", "3000")

	// Initialize API client
	cribbageAPI = &CribbageAPIClient{
		baseURL: config.APIBaseURL,
		client:  &http.Client{Timeout: 30 * time.Second},
	}

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
	game, err := cribbageAPI.GetGame(gameID)
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
	game, err := cribbageAPI.GetGame(gameID)
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

	game, err := cribbageAPI.CreateGame(request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to create game", http.StatusInternalServerError)
		return
	}

	token, err := cribbageAPI.CreateToken(game.ID, request.PlayerEmail)
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

	err := cribbageAPI.JoinGame(request.GameID, request.PlayerEmail)
	if err != nil {
		http.Error(w, "Failed to join game: "+err.Error(), http.StatusBadRequest)
		return
	}

	token, err := cribbageAPI.CreateToken(request.GameID, request.PlayerEmail)
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
	game, err := cribbageAPI.GetGame(request.GameID)
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

	game, err := cribbageAPI.GetGame(gameID)
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
