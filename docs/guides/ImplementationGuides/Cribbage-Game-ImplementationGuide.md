# Woodraska Cribbage - Go + HTMX Implementation Plan

## Integration with WoodHome WebApp Architecture

### Phase 1: Project Structure Integration (Week 1)

#### Add Cribbage to Games Module
Following the WoodHome pattern, integrate cribbage into the existing games architecture:

```
static/games/WoodraskaCribbage/
├── src/
│   ├── css/
│   │   ├── styles.css           # Main cribbage styles
│   │   ├── board.css           # Gameboard-specific styles  
│   │   ├── controller.css      # Player controller styles
│   │   └── animations.css      # Card animations
│   └── js/
│       ├── main.js             # Application entry point
│       ├── gameState.js        # Cribbage game state
│       ├── cribbageLogic.js    # Scoring and rules engine
│       ├── signalr.js          # Real-time communication
│       └── cardAnimations.js   # Card play animations
└── assets/
    └── images/                 # Card images, backgrounds
```

#### Route Registration Pattern
```go
// Add cribbage routes to main.go (most specific first)
http.HandleFunc("/play/WoodraskaCribbage/board", cribbageBoardHandler)
http.HandleFunc("/play/WoodraskaCribbage/player/", cribbagePlayerHandler)  
http.HandleFunc("/play/cribbage", cribbageHomeHandler)
http.HandleFunc("/cribbage", cribbageHomeHandler) // simple fallback
```

### Phase 2: Database Layer (Week 2)

#### SQLite Integration
Since WoodHome uses Go, integrate SQLite for local data storage:

```go
type CribbageDB struct {
    db *sql.DB
}

type Game struct {
    ID            string    `json:"id"`
    Player1Email  string    `json:"player1_email"`
    Player2Email  string    `json:"player2_email"`  
    Status        string    `json:"status"` // waiting, active, completed
    Player1Score  int       `json:"player1_score"`
    Player2Score  int       `json:"player2_score"`
    CurrentPhase  string    `json:"current_phase"` // deal, discard, pegging, counting
    CreatedAt     time.Time `json:"created_at"`
}

type GameToken struct {
    Token     string    `json:"token"`
    GameID    string    `json:"game_id"`
    UserEmail string    `json:"user_email"`
    ExpiresAt time.Time `json:"expires_at"`
}
```

#### Database Operations
```go
func (db *CribbageDB) CreateGame(player1Email string) (*Game, error)
func (db *CribbageDB) JoinGame(gameID, player2Email string) error
func (db *CribbageDB) GetGame(gameID string) (*Game, error)
func (db *CribbageDB) CreateToken(gameID, userEmail string) (string, error)
func (db *CribbageDB) ValidateToken(token string) (*GameToken, error)
```

### Phase 3: Dual Interface Implementation (Week 3)

#### Gameboard Handler (`/play/WoodraskaCribbage/board/{gameId}`)
```go
func cribbageBoardHandler(w http.ResponseWriter, r *http.Request) {
    gameID := extractGameID(r.URL.Path)
    
    game, err := db.GetGame(gameID)
    if err != nil {
        http.Error(w, "Game not found", http.StatusNotFound)
        return
    }
    
    tmpl, err := template.ParseFiles("templates/cribbage-board.html")
    if err != nil {
        log.Printf("Template error: %v", err)
        http.Error(w, "Template error", http.StatusInternalServerError)
        return
    }
    
    data := map[string]interface{}{
        "Title":        "Woodraska Cribbage - Gameboard",
        "GameID":       gameID,
        "Player1Score": game.Player1Score,
        "Player2Score": game.Player2Score,
        "CurrentPhase": game.CurrentPhase,
    }
    
    tmpl.Execute(w, data)
}
```

#### Player Controller Handler (`/play/WoodraskaCribbage/player/{token}`)
```go
func cribbagePlayerHandler(w http.ResponseWriter, r *http.Request) {
    token := extractToken(r.URL.Path)
    
    gameToken, err := db.ValidateToken(token)
    if err != nil {
        http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
        return
    }
    
    game, err := db.GetGame(gameToken.GameID)
    if err != nil {
        http.Error(w, "Game not found", http.StatusNotFound)
        return
    }
    
    // Determine if this is player 1 or 2
    playerNumber := 1
    if gameToken.UserEmail == game.Player2Email {
        playerNumber = 2
    }
    
    tmpl, err := template.ParseFiles("templates/cribbage-controller.html")
    if err != nil {
        log.Printf("Template error: %v", err)
        http.Error(w, "Template error", http.StatusInternalServerError)
        return
    }
    
    data := map[string]interface{}{
        "Title":        "Woodraska Cribbage - Your Hand",
        "GameID":       gameToken.GameID,
        "PlayerNumber": playerNumber,
        "Token":        token,
        "MyScore":      getPlayerScore(game, playerNumber),
    }
    
    tmpl.Execute(w, data)
}
```

### Phase 4: Email Integration (Week 4)

#### Gmail SMTP Integration  
```go
type EmailService struct {
    smtpHost     string
    smtpPort     int
    fromEmail    string
    fromPassword string
}

func (e *EmailService) SendGameInvite(toEmail, gameID, token string) error {
    gameboardURL := fmt.Sprintf("https://yoursite.com/play/WoodraskaCribbage/board/%s", gameID)
    controllerURL := fmt.Sprintf("https://yoursite.com/play/WoodraskaCribbage/player/%s", token)
    
    subject := "🃏 Woodraska Cribbage - You're Invited!"
    body := e.createInviteHTML(gameboardURL, controllerURL)
    
    return e.sendEmail(toEmail, subject, body)
}

func (e *EmailService) SendGameReady(player1Email, player2Email, gameID, token1, token2 string) error {
    gameboardURL := fmt.Sprintf("https://yoursite.com/play/WoodraskaCribbage/board/%s", gameID)
    
    // Send to both players with their respective controller URLs
    // Implementation details...
}
```

#### Game Creation API Endpoints
```go
// API endpoints following WoodHome pattern
http.HandleFunc("/api/cribbage/create", createGameHandler)
http.HandleFunc("/api/cribbage/join", joinGameHandler)
http.HandleFunc("/api/cribbage/play", playCardHandler)
http.HandleFunc("/api/cribbage/state", gameStateHandler)
```

### Phase 5: Real-time Communication (Week 5)

#### WebSocket/SSE Integration
Since HTMX supports Server-Sent Events, use SSE for real-time updates:

```go
func gameUpdatesHandler(w http.ResponseWriter, r *http.Request) {
    gameID := r.URL.Query().Get("gameId")
    
    // Set SSE headers
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    
    // Create channel for this connection
    updates := make(chan GameUpdate)
    
    // Register for game updates
    gameUpdateManager.Subscribe(gameID, updates)
    defer gameUpdateManager.Unsubscribe(gameID, updates)
    
    for {
        select {
        case update := <-updates:
            fmt.Fprintf(w, "data: %s\n\n", update.ToJSON())
            w.(http.Flusher).Flush()
        case <-r.Context().Done():
            return
        }
    }
}
```

#### HTMX Integration for Real-time Updates
```html
<!-- In cribbage-board.html -->
<div id="scoreboard" 
     hx-sse="connect:/api/cribbage/updates?gameId={{.GameID}}"
     hx-sse-swap="score-update"
     hx-target="#scoreboard">
    <!-- Scoreboard content -->
</div>

<!-- In cribbage-controller.html -->
<div id="hand" 
     hx-sse="connect:/api/cribbage/updates?gameId={{.GameID}}"
     hx-sse-swap="hand-update"
     hx-target="#hand">
    <!-- Player hand content -->
</div>
```

### Phase 6: Dashboard Integration (Week 6)

#### Add Cribbage to Games Section
```html
<!-- In main dashboard template -->
<div class="card">
    <h3 class="title-large">🎮 Games</h3>
    <div class="grid grid-2">
        <!-- Existing CandyLand -->
        <div>
            <a href="/play/CandyLand" class="btn btn-primary">
                <span>🍭</span>
                <span>CandyLand Adventure</span>
            </a>
        </div>
        
        <!-- New Woodraska Cribbage -->
        <div>
            <a href="/cribbage" class="btn btn-primary">
                <span>🃏</span>
                <span>Woodraska Cribbage</span>
            </a>
            <p class="body-small">
                Classic two-player card game with split-screen play
            </p>
        </div>
    </div>
</div>
```

#### Cribbage Home Page (`templates/cribbage-home.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>{{.Title}}</title>
    <link rel="stylesheet" href="/static/css/material-design-3.css">
    <link rel="stylesheet" href="/static/games/WoodraskaCribbage/src/css/styles.css">
</head>
<body>
    <a href="/" class="nav-back">← Back to Dashboard</a>
    
    <div class="game-container">
        <div class="hero">
            <h1>🃏 Woodraska Cribbage</h1>
            <p>Classic two-player card game with modern split-screen experience</p>
        </div>
        
        <div class="game-options">
            <!-- Create Game Form -->
            <div class="card">
                <h3>Start New Game</h3>
                <form hx-post="/api/cribbage/create" 
                      hx-target="#result"
                      hx-indicator="#loading">
                    <input type="email" name="player1_email" 
                           placeholder="Your email" required>
                    <button type="submit" class="btn btn-primary">
                        Create Game
                    </button>
                </form>
            </div>
            
            <!-- Join Game Form -->
            <div class="card">
                <h3>Join Existing Game</h3>
                <form hx-post="/api/cribbage/join"
                      hx-target="#result"
                      hx-indicator="#loading">
                    <input type="text" name="game_id" 
                           placeholder="Game ID" required>
                    <input type="email" name="player2_email" 
                           placeholder="Your email" required>
                    <button type="submit" class="btn btn-success">
                        Join Game
                    </button>
                </form>
            </div>
        </div>
        
        <div id="result"></div>
        <div id="loading" class="loading" style="display:none;">Processing...</div>
    </div>
</body>
</html>
```

## Key Advantages of This Approach

### Technical Benefits
- **Consistent Architecture**: Follows established WoodHome patterns
- **Single Codebase**: Go backend handles everything
- **Real-time Updates**: SSE integration with HTMX
- **Material Design**: Consistent UI with rest of application
- **Local Storage**: SQLite for simple, reliable data persistence

### User Experience Benefits  
- **Split-Screen Gaming**: Separate board and controller interfaces
- **Mobile Optimized**: Controllers designed for phone/tablet use
- **Email Invitations**: Simple game setup via email
- **No Registration**: Magic link authentication
- **Social Gaming**: Recreates physical cribbage experience

### Implementation Benefits
- **Incremental Development**: Build and test in phases  
- **Template Reuse**: Leverage existing WoodHome template system
- **Static Asset Management**: Organized game assets
- **Error Handling**: Comprehensive logging and user feedback
- **Extensible**: Easy to add more card games later
