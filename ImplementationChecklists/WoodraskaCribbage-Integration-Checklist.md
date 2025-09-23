# Woodraska Cribbage - Integration Implementation Checklist

## Overview
This checklist provides step-by-step instructions for integrating the Woodraska Cribbage game into the existing WoodHome WebApp infrastructure, following the established patterns and architecture.

---

## Phase 1: Project Structure Setup (Week 1)

### ✅ 1.1 Create Game Directory Structure
- [x] Create main game directory: `static/games/WoodraskaCribbage/`
- [x] Create CSS directory: `static/games/WoodraskaCribbage/src/css/`
- [x] Create JavaScript directory: `static/games/WoodraskaCribbage/src/js/`
- [x] Create assets directory: `static/games/WoodraskaCribbage/assets/images/`
- [x] Create templates directory: `templates/` (if not exists)

### ✅ 1.2 Initialize CSS Files
- [x] Create `static/games/WoodraskaCribbage/src/css/styles.css` - Main cribbage styles
- [x] Create `static/games/WoodraskaCribbage/src/css/board.css` - Gameboard-specific styles
- [x] Create `static/games/WoodraskaCribbage/src/css/controller.css` - Player controller styles
- [x] Create `static/games/WoodraskaCribbage/src/css/animations.css` - Card animations
- [x] Create `static/games/WoodraskaCribbage/src/css/responsive.css` - Mobile responsiveness

### ✅ 1.3 Initialize JavaScript Files
- [x] Create `static/games/WoodraskaCribbage/src/js/main.js` - Application entry point
- [x] Create `static/games/WoodraskaCribbage/src/js/gameState.js` - Cribbage game state
- [x] Create `static/games/WoodraskaCribbage/src/js/cribbageLogic.js` - Scoring and rules engine
- [x] Create `static/games/WoodraskaCribbage/src/js/signalr.js` - Real-time communication
- [x] Create `static/games/WoodraskaCribbage/src/js/cardAnimations.js` - Card play animations

### ✅ 1.4 Create Template Files
- [x] Create `templates/cribbage-home.html` - Main cribbage landing page
- [x] Create `templates/cribbage-board.html` - Gameboard interface
- [x] Create `templates/cribbage-controller.html` - Player controller interface

---

## Phase 2: API Integration (Week 2)

### ✅ 2.1 API Client Setup
- [x] Remove SQLite dependency from `go.mod`
- [x] Create API client struct in `main.go`:
  ```go
  type CribbageAPIClient struct {
      baseURL string
      client  *http.Client
  }
  ```
- [x] Create data models for API communication:
  ```go
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
  ```

### ✅ 2.2 API Client Operations Implementation
- [x] Implement `CreateGame(player1Email string) (*Game, error)` - HTTP POST to `/api/cribbage/create`
- [x] Implement `JoinGame(gameID, player2Email string) error` - HTTP POST to `/api/cribbage/join`
- [x] Implement `GetGame(gameID string) (*Game, error)` - HTTP GET to `/api/cribbage/state`
- [x] Implement `CreateToken(gameID, userEmail string) (string, error)` - Token generation
- [x] Implement `ValidateToken(token string) (*GameToken, error)` - Token validation
- [x] Implement `UpdateGameState(gameID string, updates map[string]interface{}) error` - Game state updates

### ✅ 2.3 Route Registration in main.go
- [x] Add cribbage routes to `main.go` (most specific first):
  ```go
  // Cribbage routes
  http.HandleFunc("/play/WoodraskaCribbage/board/", cribbageBoardHandler)
  http.HandleFunc("/play/WoodraskaCribbage/player/", cribbagePlayerHandler)
  http.HandleFunc("/play/cribbage", cribbageHomeHandler)
  http.HandleFunc("/cribbage", cribbageHomeHandler) // simple fallback
  ```

### ✅ 2.4 Handler Implementation
- [x] Implement `cribbageHomeHandler(w http.ResponseWriter, r *http.Request)`
- [x] Implement `cribbageBoardHandler(w http.ResponseWriter, r *http.Request)`
- [x] Implement `cribbagePlayerHandler(w http.ResponseWriter, r *http.Request)`
- [x] Add error handling and logging to all handlers
- [x] Add template parsing with error handling
- [x] Add data preparation for templates

### ✅ 2.5 API Proxy Endpoints
- [x] Add API proxy routes to `main.go`:
  ```go
  http.HandleFunc("/api/cribbage/create", createGameHandler)
  http.HandleFunc("/api/cribbage/join", joinGameHandler)
  http.HandleFunc("/api/cribbage/play", playCardHandler)
  http.HandleFunc("/api/cribbage/state", gameStateHandler)
  http.HandleFunc("/api/cribbage/updates", gameUpdatesHandler)
  ```
- [x] Implement `createGameHandler(w http.ResponseWriter, r *http.Request)` - Proxies to main API
- [x] Implement `joinGameHandler(w http.ResponseWriter, r *http.Request)` - Proxies to main API
- [x] Implement `playCardHandler(w http.ResponseWriter, r *http.Request)` - Proxies to main API
- [x] Implement `gameStateHandler(w http.ResponseWriter, r *http.Request)` - Proxies to main API
- [x] Implement `gameUpdatesHandler(w http.ResponseWriter, r *http.Request)` - Proxies to main API

---

## Phase 2.5: Main API Project Requirements (Week 2.5)

### ✅ 2.5.1 Main API Project Setup
- [x] **CRITICAL**: Implement cribbage endpoints in main WoodHome API project
- [x] Add cribbage database schema to main API project
- [x] Create cribbage models in main API project
- [x] Implement cribbage business logic in main API project

### ✅ 2.5.2 Required API Endpoints in Main Project
- [x] `POST /api/cribbage/create` - Create new cribbage game
- [x] `POST /api/cribbage/join` - Join existing cribbage game  
- [x] `POST /api/cribbage/play` - Play card or make move
- [x] `GET /api/cribbage/state` - Get current game state
- [x] `GET /api/cribbage/updates` - Server-Sent Events for real-time updates

### ✅ 2.5.3 Database Integration in Main API
- [x] Add cribbage tables to main database (SQL Server)
- [x] Implement cribbage data models in main API
- [x] Add cribbage business logic and game rules
- [x] Implement real-time updates via SSE/WebSocket

---

## Phase 3: Frontend Implementation (Week 3)

### ✅ 3.1 Cribbage Home Page Template
- [x] Create `templates/cribbage-home.html` with:
  - [x] Material Design 3 styling integration
  - [x] Navigation back to dashboard
  - [x] Create Game form with HTMX integration
  - [x] Join Game form with HTMX integration
  - [x] Loading indicators
  - [x] Error handling display

### ✅ 3.2 Gameboard Template
- [x] Create `templates/cribbage-board.html` with:
  - [x] Split-screen layout for two players
  - [x] Score display
  - [x] Game state indicators
  - [x] Real-time updates via SSE
  - [x] Material Design 3 card components
  - [x] Responsive design for mobile

### ✅ 3.3 Player Controller Template
- [x] Create `templates/cribbage-controller.html` with:
  - [x] Player hand display
  - [x] Card selection interface
  - [x] Action buttons (play card, discard, etc.)
  - [x] Score tracking
  - [x] Real-time updates via SSE
  - [x] Mobile-optimized touch interface

### ✅ 3.4 CSS Implementation
- [x] Implement main styles in `styles.css`:
  - [x] Material Design 3 integration
  - [x] Color scheme matching WoodHome theme
  - [x] Typography consistency
  - [x] Component styling (cards, buttons, forms)
- [x] Implement board styles in `board.css`:
  - [x] Gameboard layout
  - [x] Card positioning
  - [x] Score display
  - [x] Player areas
- [x] Implement controller styles in `controller.css`:
  - [x] Hand display
  - [x] Card selection states
  - [x] Action buttons
  - [x] Mobile touch targets
- [x] Implement animations in `animations.css`:
  - [x] Card flip animations
  - [x] Card play animations
  - [x] Score update animations
  - [x] Loading animations
- [x] Implement responsive design in `responsive.css`:
  - [x] Mobile breakpoints
  - [x] Tablet optimization
  - [x] Touch-friendly interfaces

### ✅ 3.5 JavaScript Implementation
- [x] Implement `main.js`:
  - [x] Application initialization
  - [x] Event listener setup
  - [x] HTMX integration
  - [x] Error handling
- [x] Implement `gameState.js`:
  - [x] Game state management
  - [x] Player data handling
  - [x] Score tracking
  - [x] Phase management
- [x] Implement `cribbageLogic.js`:
  - [x] Card dealing logic
  - [x] Scoring calculations
  - [x] Game rules enforcement
  - [x] Win condition checking
- [x] Implement `signalr.js`:
  - [x] SSE connection management
  - [x] Real-time update handling
  - [x] Connection error handling
  - [x] Reconnection logic
- [x] Implement `cardAnimations.js`:
  - [x] Card flip animations
  - [x] Card play animations
  - [x] Score update animations
  - [x] Transition effects

---

## Phase 4: Email Integration (Week 4)

### ✅ 4.1 Email Service Setup
- [x] Add email dependencies to `go.mod`:
  ```bash
  go get gopkg.in/gomail.v2
  ```
- [x] Create email service struct in `main.go`:
  ```go
  type EmailService struct {
      smtpHost     string
      smtpPort     int
      fromEmail    string
      fromPassword string
  }
  ```
- [x] Add email configuration to `WoodHomeConfig`:
  ```go
  type WoodHomeConfig struct {
      APIBaseURL    string
      Port          string
      SMTPHost      string
      SMTPPort      int
      FromEmail     string
      FromPassword  string
  }
  ```

### ✅ 4.2 Email Template Creation
- [x] Create email templates directory: `templates/email/`
- [x] Create `templates/email/game-invitation.html` - Game invitation email
- [x] Create `templates/email/game-update.html` - Game state updates
- [x] Create `templates/email/game-finished.html` - Game finished notification

### ✅ 4.3 Email Service Implementation
- [x] Implement `SendGameInvitation(gameID, player1Email, player2Email string) error`
- [x] Implement `SendGameUpdate(gameID, playerEmail, updateType, message string) error`
- [x] Implement `SendGameEndNotification(gameID, playerEmail, winner, finalScore string) error`
- [x] Add email template rendering
- [x] Add SMTP connection handling
- [x] Add error handling and logging

### ✅ 4.4 Environment Configuration
- [x] Add email environment variables to `.env.example`:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  FROM_EMAIL=your-email@gmail.com
  FROM_PASSWORD=your-app-password
  ```
- [ ] Update `getEnv` function calls for email configuration
- [ ] Add email service initialization in `main()`

---

## Phase 5: Real-time Communication (Week 5)

### ✅ 5.1 Server-Sent Events Implementation
- [ ] Create game update manager in `main.go`:
  ```go
  type GameUpdateManager struct {
      subscribers map[string][]chan GameUpdate
      mutex       sync.RWMutex
  }
  
  type GameUpdate struct {
      GameID    string      `json:"game_id"`
      Type      string      `json:"type"`
      Data      interface{} `json:"data"`
      Timestamp time.Time   `json:"timestamp"`
  }
  ```
- [ ] Implement `Subscribe(gameID string, updates chan GameUpdate)`
- [ ] Implement `Unsubscribe(gameID string, updates chan GameUpdate)`
- [ ] Implement `Broadcast(gameID string, update GameUpdate)`

### ✅ 5.2 SSE Handler Implementation
- [ ] Implement `gameUpdatesHandler` with:
  - [ ] SSE headers setup
  - [ ] Connection management
  - [ ] Update broadcasting
  - [ ] Error handling
  - [ ] Connection cleanup

### ✅ 5.3 HTMX SSE Integration
- [ ] Add SSE integration to `cribbage-board.html`:
  ```html
  <div id="scoreboard" 
       hx-sse="connect:/api/cribbage/updates?gameId={{.GameID}}"
       hx-sse-swap="score-update"
       hx-target="#scoreboard">
  ```
- [ ] Add SSE integration to `cribbage-controller.html`:
  ```html
  <div id="hand" 
       hx-sse="connect:/api/cribbage/updates?gameId={{.GameID}}"
       hx-sse-swap="hand-update"
       hx-target="#hand">
  ```

### ✅ 5.4 Update Broadcasting
- [ ] Add update broadcasting to game state changes
- [ ] Add update broadcasting to card plays
- [ ] Add update broadcasting to score changes
- [ ] Add update broadcasting to phase transitions

---

## Phase 6: Dashboard Integration (Week 6)

### ✅ 6.1 Dashboard Games Section Update
- [ ] Update `templates/index.html` games section:
  ```html
  <div class="card">
      <h3 class="title-large" style="margin-bottom: 16px;">🎮 Games</h3>
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

### ✅ 6.2 Navigation Integration
- [ ] Add cribbage navigation to all game templates
- [ ] Ensure consistent back navigation
- [ ] Add breadcrumb navigation for game flow
- [ ] Test navigation between all game states

### ✅ 6.3 Error Handling Integration
- [ ] Add cribbage-specific error handling
- [ ] Integrate with existing error display system
- [ ] Add logging for cribbage operations
- [ ] Test error scenarios

---

## Phase 7: Testing and Validation (Week 7)

### ✅ 7.1 Unit Testing
- [ ] Test database operations
- [ ] Test game state management
- [ ] Test scoring calculations
- [ ] Test email sending
- [ ] Test SSE connections

### ✅ 7.2 Integration Testing
- [ ] Test complete game flow
- [ ] Test real-time updates
- [ ] Test email notifications
- [ ] Test mobile responsiveness
- [ ] Test error handling

### ✅ 7.3 User Acceptance Testing
- [ ] Test game creation flow
- [ ] Test game joining flow
- [ ] Test card playing mechanics
- [ ] Test scoring accuracy
- [ ] Test mobile experience

### ✅ 7.4 Performance Testing
- [ ] Test with multiple concurrent games
- [ ] Test SSE connection limits
- [ ] Test database performance
- [ ] Test email delivery

---

## Phase 8: Deployment and Documentation (Week 8)

### ✅ 8.1 Production Configuration
- [ ] Update environment variables for production
- [ ] Configure production email settings
- [ ] Set up production database
- [ ] Configure Cloudflare tunnel for cribbage routes

### ✅ 8.2 Documentation
- [ ] Update main README.md with cribbage information
- [ ] Create cribbage-specific documentation
- [ ] Document API endpoints
- [ ] Create user guide

### ✅ 8.3 Monitoring and Logging
- [ ] Add cribbage-specific logging
- [ ] Set up error monitoring
- [ ] Add performance metrics
- [ ] Create health checks

---

## Implementation Notes

### Key Integration Points
1. **API Architecture**: WebApp calls main API project for all cribbage operations
2. **Route Registration**: Add cribbage routes following existing pattern
3. **Template System**: Use existing Go template system
4. **Static Assets**: Follow existing static file organization
5. **Material Design**: Integrate with existing Material Design 3 theme
6. **HTMX Integration**: Use existing HTMX patterns for dynamic updates
7. **Error Handling**: Follow existing error handling patterns

### API Architecture Considerations
- **WebApp Role**: Pure frontend client calling main API
- **Main API Role**: Handles all cribbage business logic and data persistence
- **Separation of Concerns**: Clean separation between frontend and backend
- **Scalability**: Multiple WebApp instances can share same API backend
- **Consistency**: Follows existing WoodHome architecture patterns

### Security Considerations
- Validate all user inputs in main API
- Sanitize email addresses in main API
- Implement rate limiting for API endpoints in main API
- Secure token generation and validation in main API
- Add CSRF protection for forms
- Use existing authentication/authorization from main API

### Performance Considerations
- **API Client**: Efficient HTTP client with connection pooling
- **Caching**: Implement caching in main API for frequently accessed data
- **SSE Connections**: Optimize Server-Sent Events in main API
- **Database**: Use main API's existing database infrastructure
- **Load Balancing**: Multiple WebApp instances can share API load

### Mobile Optimization
- Touch-friendly card interfaces
- Responsive design for all screen sizes
- Optimize for mobile data usage
- Implement offline capabilities where possible
- Test on various mobile devices

---

## API Requirements Documentation

### Required Endpoints in Main WoodHome API Project

#### 1. Create Game
```
POST /api/cribbage/create
Content-Type: application/json

Request:
{
  "playerEmail": "player1@example.com"
}

Response:
{
  "status": "success",
  "message": "Game created successfully",
  "data": {
    "gameId": "game_1234567890",
    "playerEmail": "player1@example.com",
    "token": "token_1234567890"
  }
}
```

#### 2. Join Game
```
POST /api/cribbage/join
Content-Type: application/json

Request:
{
  "gameId": "game_1234567890",
  "playerEmail": "player2@example.com"
}

Response:
{
  "status": "success",
  "message": "Joined game successfully",
  "data": {
    "gameId": "game_1234567890",
    "playerEmail": "player2@example.com",
    "token": "token_1234567890"
  }
}
```

#### 3. Play Card/Make Move
```
POST /api/cribbage/play
Content-Type: application/json

Request:
{
  "gameId": "game_1234567890",
  "playerEmail": "player1@example.com",
  "cardId": "card_123", // for play action
  "cardIds": ["card_123", "card_456"], // for discard action
  "action": "play|discard|count|go"
}

Response:
{
  "status": "success",
  "message": "Move processed successfully",
  "data": {
    "gameId": "game_1234567890",
    "action": "play",
    "gameState": { ... }
  }
}
```

#### 4. Get Game State
```
GET /api/cribbage/state?gameId=game_1234567890&playerEmail=player1@example.com

Response:
{
  "status": "success",
  "message": "Game state retrieved",
  "data": {
    "id": "game_1234567890",
    "player1_email": "player1@example.com",
    "player2_email": "player2@example.com",
    "status": "active",
    "player1_score": 15,
    "player2_score": 12,
    "current_phase": "play",
    "current_player": "player1@example.com",
    "game_data": "{ ... }",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:05:00Z"
  }
}
```

#### 5. Real-time Updates (SSE)
```
GET /api/cribbage/updates?gameId=game_1234567890&playerEmail=player1@example.com

Response: Server-Sent Events stream
data: {"type":"connected","message":"Connected to game updates"}

data: {"type":"heartbeat","timestamp":1704067200}

data: {"type":"game_update","payload":{"gameId":"game_1234567890","updateType":"card_played","data":{...}}}
```

### Database Schema Requirements for Main API

```sql
-- Games table
CREATE TABLE cribbage_games (
    id VARCHAR(255) PRIMARY KEY,
    player1_email VARCHAR(255) NOT NULL,
    player2_email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    current_phase VARCHAR(50) DEFAULT 'waiting',
    current_player VARCHAR(255),
    game_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game tokens table
CREATE TABLE cribbage_game_tokens (
    token VARCHAR(255) PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES cribbage_games(id) ON DELETE CASCADE
);

-- Game moves table
CREATE TABLE cribbage_game_moves (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_email VARCHAR(255) NOT NULL,
    move_type VARCHAR(50) NOT NULL,
    move_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES cribbage_games(id) ON DELETE CASCADE
);
```

---

## Success Criteria

### Functional Requirements
- [ ] Users can create cribbage games
- [ ] Users can join games via email invitation
- [ ] Real-time updates work correctly
- [ ] Scoring is accurate
- [ ] Game flow is intuitive
- [ ] Mobile experience is smooth

### Technical Requirements
- [ ] All routes work correctly
- [ ] Database operations are reliable
- [ ] Email delivery is consistent
- [ ] SSE connections are stable
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable

### User Experience Requirements
- [ ] Interface is intuitive
- [ ] Navigation is clear
- [ ] Feedback is immediate
- [ ] Mobile experience is excellent
- [ ] Loading states are clear
- [ ] Error messages are helpful

---

## Post-Implementation

### Maintenance Tasks
- [ ] Monitor game performance
- [ ] Track user engagement
- [ ] Collect feedback
- [ ] Plan future enhancements
- [ ] Update documentation
- [ ] Optimize based on usage patterns

### Future Enhancements
- [ ] Add more card games
- [ ] Implement tournaments
- [ ] Add statistics tracking
- [ ] Implement chat features
- [ ] Add game replays
- [ ] Create mobile app

This checklist ensures a systematic and thorough integration of the Woodraska Cribbage game into your existing WoodHome WebApp infrastructure while maintaining consistency, performance, and user experience.
