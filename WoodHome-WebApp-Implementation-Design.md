# WoodHome WebApp - Implementation Design Document

## Overview

The WoodHome WebApp is a modern Material Design 3 frontend application built with Go and HTMX, designed to serve as a smart home automation dashboard with integrated gaming capabilities. The application follows a modular architecture that supports easy extension for new games and home automation features.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WoodHome WebApp                           │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (Material Design 3 + HTMX)                 │
│  ├── Dashboard (index.html)                                │
│  ├── Games Module (candyland.html)                        │
│  └── Static Assets (CSS, JS, Images)                      │
├─────────────────────────────────────────────────────────────┤
│  Backend Layer (Go HTTP Server)                            │
│  ├── Route Handlers                                        │
│  ├── Template Engine                                       │
│  ├── Static File Server                                    │
│  └── API Proxy Layer                                       │
├─────────────────────────────────────────────────────────────┤
│  External Services                                         │
│  ├── WoodHome API (localhost:8080)                        │
│  ├── Cloudflare Tunnel (Public Access)                    │
│  └── Weather API (External)                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Backend Server (Go)

#### Main Application Structure
```go
// Core Configuration
type WoodHomeConfig struct {
    APIBaseURL string  // WoodHome API endpoint
    Port       string  // Web server port
}

// Standardized API Response
type APIResponse struct {
    Status  string      `json:"status"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}
```

#### Route Architecture
```
Routes (in order of specificity):
├── /play/CandyLand          → candyLandHandler
├── /play/Candyland          → candyLandHandler (case variation)
├── /candyland               → candyLandHandler (simple path)
├── /test                    → testHandler
├── /api/health              → healthCheckHandler
├── /api/connectivity        → connectivityTestHandler
├── /static/*                → Static file server
└── /                        → homeHandler (catch-all)
```

#### Key Features
- **Template Engine**: Go's built-in `html/template` package
- **Static File Serving**: Direct file serving for assets
- **API Proxy**: Forward requests to WoodHome API
- **Error Handling**: Comprehensive error logging and user feedback
- **Configuration**: Environment-based configuration with defaults

### 2. Frontend Architecture

#### Material Design 3 Implementation
- **Design System**: Material You with dynamic color support
- **Typography**: Roboto font family with proper scale
- **Components**: Cards, buttons, status indicators, grids
- **Responsive**: Mobile-first design approach
- **Accessibility**: Semantic HTML and ARIA support

#### HTMX Integration
- **Dynamic Content**: Server-side rendering with client-side interactions
- **API Calls**: Seamless API communication without full page reloads
- **Real-time Updates**: Status indicators and connectivity testing
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

### 3. Games Module Architecture

#### Current Implementation: CandyLand
```
Games Module Structure:
├── Route Integration
│   ├── /play/CandyLand      → Full game experience
│   ├── /play/Candyland      → Case variation support
│   └── /candyland           → Simple path fallback
├── Template System
│   └── templates/candyland.html → Game-specific template
├── Static Assets
│   ├── /static/games/CandyLand/
│   │   ├── src/css/         → Game-specific styles
│   │   ├── src/js/          → Game logic and interactions
│   │   └── assets/          → Images, sounds, etc.
│   └── Game Assets
│       ├── Images (cards, players, backgrounds)
│       ├── Sounds (optional)
│       └── Animations
└── JavaScript Architecture
    ├── main.js              → Application entry point
    ├── gameState.js         → Game state management
    ├── gameLogic.js         → Core game rules
    ├── gameBoard.js         → Board rendering
    ├── animations.js        → Visual effects
    └── soundEffects.js      → Audio management
```

#### Game Integration Pattern
1. **Route Registration**: Add game routes in `main.go`
2. **Template Creation**: Create game-specific HTML template
3. **Asset Organization**: Place game assets in `/static/games/[GameName]/`
4. **JavaScript Modules**: Implement game logic in separate JS files
5. **Styling**: Create game-specific CSS with Material Design 3 integration

## Detailed Implementation Design

### 1. Backend Implementation

#### Route Handler Pattern
```go
func gameHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Set content type and headers
    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    
    // 2. Parse template with error handling
    tmpl, err := template.ParseFiles("templates/game.html")
    if err != nil {
        log.Printf("Template parsing error: %v", err)
        http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    
    // 3. Prepare template data
    data := map[string]interface{}{
        "Title": "Game Title",
        // Add game-specific data
    }
    
    // 4. Execute template with error handling
    if err := tmpl.Execute(w, data); err != nil {
        log.Printf("Template execution error: %v", err)
        http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
        return
    }
}
```

#### API Integration Pattern
```go
func connectivityTestHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // Test external API connection
    client := &http.Client{Timeout: 5 * time.Second}
    resp, err := client.Get(config.APIBaseURL + "/health")
    
    var response APIResponse
    if err != nil {
        response = APIResponse{
            Status:  "error",
            Message: "Failed to connect to API: " + err.Error(),
        }
        w.WriteHeader(http.StatusServiceUnavailable)
    } else {
        // Handle successful connection
        response = APIResponse{
            Status:  "success",
            Message: "Successfully connected to API",
            Data: map[string]interface{}{
                "api_url":     config.APIBaseURL,
                "status_code": resp.StatusCode,
            },
        }
    }
    
    json.NewEncoder(w).Encode(response)
}
```

### 2. Frontend Implementation

#### Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta tags and title -->
    <title>{{.Title}}</title>
    
    <!-- Material Design 3 CSS -->
    <link rel="stylesheet" href="/static/css/material-design-3.css">
    
    <!-- Game-specific CSS -->
    <link rel="stylesheet" href="/static/games/[GameName]/src/css/styles.css">
    
    <!-- Google Fonts and Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    
    <!-- HTMX for dynamic interactions -->
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body>
    <!-- Navigation -->
    <a href="/" class="nav-back">← Back to Dashboard</a>
    
    <!-- Game Container -->
    <div id="game-container">
        <!-- Game-specific content -->
    </div>
    
    <!-- Game Scripts -->
    <script src="/static/games/[GameName]/src/js/main.js"></script>
    <!-- Additional game modules -->
</body>
</html>
```

#### HTMX Integration Pattern
```html
<!-- API Testing with HTMX -->
<button class="btn btn-primary" 
        hx-get="/api/connectivity" 
        hx-target="#connectivity-result"
        hx-indicator="#connectivity-loading">
    <span class="material-icons">wifi</span>
    Test API Connection
</button>

<!-- Response handling -->
<div id="connectivity-result"></div>
<div id="connectivity-loading" class="loading"></div>
```

### 3. Games Module Design

#### Game Integration Requirements

For adding a new game module, follow this pattern:

1. **Route Registration** (in `main.go`):
```go
// Add game routes (most specific first)
http.HandleFunc("/play/NewGame", newGameHandler)
http.HandleFunc("/play/newgame", newGameHandler) // case variation
http.HandleFunc("/newgame", newGameHandler)     // simple path
```

2. **Handler Implementation**:
```go
func newGameHandler(w http.ResponseWriter, r *http.Request) {
    log.Printf("NewGame handler called for path: %s", r.URL.Path)
    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    
    tmpl, err := template.ParseFiles("templates/newgame.html")
    if err != nil {
        log.Printf("Template parsing error: %v", err)
        http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    
    data := map[string]interface{}{
        "Title": "New Game - Mark Woodraska",
    }
    
    if err := tmpl.Execute(w, data); err != nil {
        log.Printf("Template execution error: %v", err)
        http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    log.Printf("NewGame template executed successfully")
}
```

3. **Template Creation** (`templates/newgame.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}}</title>
    
    <!-- Game-specific styles -->
    <link rel="stylesheet" href="/static/games/NewGame/src/css/styles.css">
    <link rel="stylesheet" href="/static/games/NewGame/src/css/animations.css">
    <link rel="stylesheet" href="/static/games/NewGame/src/css/responsive.css">
    
    <!-- Navigation styling -->
    <style>
        .nav-back {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            color: #333;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
    </style>
</head>
<body>
    <!-- Navigation back to main site -->
    <a href="/" class="nav-back">← Back to Dashboard</a>
    
    <!-- Game Container -->
    <div id="game-container">
        <!-- Game-specific content -->
    </div>
    
    <!-- Game Scripts -->
    <script src="/static/games/NewGame/src/js/main.js"></script>
    <!-- Additional game modules as needed -->
</body>
</html>
```

4. **Asset Organization**:
```
static/games/NewGame/
├── src/
│   ├── css/
│   │   ├── styles.css        # Main game styles
│   │   ├── animations.css   # Animation effects
│   │   └── responsive.css    # Responsive design
│   └── js/
│       ├── main.js          # Application entry point
│       ├── gameState.js     # Game state management
│       ├── gameLogic.js     # Core game rules
│       ├── gameBoard.js     # Board rendering
│       ├── animations.js   # Visual effects
│       └── soundEffects.js  # Audio management
└── assets/
    ├── images/              # Game images
    ├── sounds/              # Audio files
    └── data/                # Game data files
```

#### JavaScript Architecture Pattern

**main.js** - Application Entry Point:
```javascript
// Initialize game when page loads
window.addEventListener('load', () => {
    initializeApplication();
});

function initializeApplication() {
    console.log('🎮 Initializing New Game...');
    
    // Initialize all game systems
    initializeGame();
    initializeAudioOnInteraction();
    initializeKeyboardControls();
    initializeBoardEvents();
    initializeAnimationOptimizations();
    
    // Add global event listeners
    setupGlobalEventListeners();
    
    // Adjust board for current screen size
    adjustBoardForScreenSize();
    
    console.log('🎮 New Game ready to play!');
}
```

**gameState.js** - State Management:
```javascript
class GameState {
    constructor() {
        this.players = [];
        this.currentPlayer = 0;
        this.gamePhase = 'setup'; // setup, playing, finished
        this.scores = {};
        this.gameData = {};
    }
    
    // State management methods
    addPlayer(player) { /* implementation */ }
    nextTurn() { /* implementation */ }
    updateScore(playerId, score) { /* implementation */ }
    reset() { /* implementation */ }
}
```

**gameLogic.js** - Core Game Rules:
```javascript
class GameLogic {
    constructor(gameState) {
        this.state = gameState;
        this.rules = {};
    }
    
    // Game rule implementations
    validateMove(move) { /* implementation */ }
    calculateScore(player) { /* implementation */ }
    checkWinCondition() { /* implementation */ }
    processTurn() { /* implementation */ }
}
```

### 4. Dashboard Integration

#### Games Section in Dashboard
```html
<!-- Games Section -->
<div class="card">
    <h3 class="title-large" style="margin-bottom: 16px;">🎮 Games</h3>
    <p class="body-large" style="margin-bottom: 24px; color: var(--md-sys-color-on-surface-variant);">
        Enjoy some fun games while managing your smart home.
    </p>

    <div class="grid grid-2">
        <div>
            <a href="/play/CandyLand" class="btn btn-primary"
               style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <span>🍭</span>
                <span>CandyLand Adventure</span>
            </a>
            <p class="body-small" style="margin-top: 8px; color: var(--md-sys-color-on-surface-variant);">
                A magical board game adventure for all ages
            </p>
        </div>
        <div>
            <a href="/play/NewGame" class="btn btn-primary"
               style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                <span>🎯</span>
                <span>New Game</span>
            </a>
            <p class="body-small" style="margin-top: 8px; color: var(--md-sys-color-on-surface-variant);">
                Description of the new game
            </p>
        </div>
    </div>
</div>
```

## Configuration and Deployment

### Environment Configuration
```go
// Configuration structure
type WoodHomeConfig struct {
    APIBaseURL string  // WoodHome API endpoint (default: http://localhost:8080)
    Port       string  // Web server port (default: 3000)
}

// Environment variable handling
func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

### Cloudflare Tunnel Integration
```yaml
# cloudflare-tunnel-config.yml
tunnel: [tunnel-id]
credentials-file: [credentials-path]

ingress:
  - service: http://localhost:3000
```

### Static File Serving
```go
// Static files (register before catch-all)
http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))
```

## Security Considerations

1. **Input Validation**: All user inputs should be validated
2. **Template Injection**: Use Go's template engine safely
3. **Static File Security**: Serve only intended static files
4. **API Proxy**: Validate and sanitize API responses
5. **HTTPS**: Use Cloudflare Tunnel for secure public access

## Performance Optimization

1. **Static File Caching**: Implement proper cache headers
2. **Template Caching**: Cache parsed templates
3. **Asset Minification**: Minify CSS and JavaScript
4. **Image Optimization**: Compress and optimize images
5. **CDN Integration**: Use Cloudflare for global distribution

## Testing Strategy

1. **Unit Tests**: Test individual handlers and functions
2. **Integration Tests**: Test API connectivity and proxy functionality
3. **Template Tests**: Verify template rendering
4. **Game Tests**: Test game logic and state management
5. **End-to-End Tests**: Test complete user workflows

## Monitoring and Logging

1. **Application Logs**: Structured logging for debugging
2. **Performance Metrics**: Monitor response times
3. **Error Tracking**: Track and alert on errors
4. **Usage Analytics**: Monitor game usage and performance

## Future Extensibility

### Adding New Games
1. Follow the established pattern for route registration
2. Create game-specific template and assets
3. Implement JavaScript modules following the architecture
4. Add dashboard integration
5. Test thoroughly

### Adding Home Automation Features
1. Create new route handlers for automation endpoints
2. Add HTMX integration for real-time updates
3. Implement Material Design 3 components
4. Add API proxy integration
5. Update dashboard with new features

### API Integration
1. Extend the proxy layer for new API endpoints
2. Add authentication and authorization
3. Implement real-time communication (WebSockets)
4. Add data persistence layer
5. Implement caching strategies

This implementation design provides a solid foundation for extending the WoodHome WebApp with new games and home automation features while maintaining consistency, performance, and user experience.
