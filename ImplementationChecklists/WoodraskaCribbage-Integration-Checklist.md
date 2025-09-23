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

## Phase 2: Backend Integration (Week 2)

### ✅ 2.1 Database Layer Setup
- [ ] Add SQLite dependency to `go.mod`:
  ```bash
  go get github.com/mattn/go-sqlite3
  ```
- [ ] Create database schema file: `database/cribbage_schema.sql`
- [ ] Create database models in `main.go`:
  ```go
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
      CreatedAt     time.Time `json:"created_at"`
  }
  
  type GameToken struct {
      Token     string    `json:"token"`
      GameID    string    `json:"game_id"`
      UserEmail string    `json:"user_email"`
      ExpiresAt time.Time `json:"expires_at"`
  }
  ```

### ✅ 2.2 Database Operations Implementation
- [ ] Implement `CreateGame(player1Email string) (*Game, error)`
- [ ] Implement `JoinGame(gameID, player2Email string) error`
- [ ] Implement `GetGame(gameID string) (*Game, error)`
- [ ] Implement `CreateToken(gameID, userEmail string) (string, error)`
- [ ] Implement `ValidateToken(token string) (*GameToken, error)`
- [ ] Implement `UpdateGameState(gameID string, updates map[string]interface{}) error`

### ✅ 2.3 Route Registration in main.go
- [ ] Add cribbage routes to `main.go` (most specific first):
  ```go
  // Cribbage routes
  http.HandleFunc("/play/WoodraskaCribbage/board/", cribbageBoardHandler)
  http.HandleFunc("/play/WoodraskaCribbage/player/", cribbagePlayerHandler)
  http.HandleFunc("/play/cribbage", cribbageHomeHandler)
  http.HandleFunc("/cribbage", cribbageHomeHandler) // simple fallback
  ```

### ✅ 2.4 Handler Implementation
- [ ] Implement `cribbageHomeHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `cribbageBoardHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `cribbagePlayerHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Add error handling and logging to all handlers
- [ ] Add template parsing with error handling
- [ ] Add data preparation for templates

### ✅ 2.5 API Endpoints
- [ ] Add API routes to `main.go`:
  ```go
  http.HandleFunc("/api/cribbage/create", createGameHandler)
  http.HandleFunc("/api/cribbage/join", joinGameHandler)
  http.HandleFunc("/api/cribbage/play", playCardHandler)
  http.HandleFunc("/api/cribbage/state", gameStateHandler)
  http.HandleFunc("/api/cribbage/updates", gameUpdatesHandler)
  ```
- [ ] Implement `createGameHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `joinGameHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `playCardHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `gameStateHandler(w http.ResponseWriter, r *http.Request)`
- [ ] Implement `gameUpdatesHandler(w http.ResponseWriter, r *http.Request)`

---

## Phase 3: Frontend Implementation (Week 3)

### ✅ 3.1 Cribbage Home Page Template
- [ ] Create `templates/cribbage-home.html` with:
  - [ ] Material Design 3 styling integration
  - [ ] Navigation back to dashboard
  - [ ] Create Game form with HTMX integration
  - [ ] Join Game form with HTMX integration
  - [ ] Loading indicators
  - [ ] Error handling display

### ✅ 3.2 Gameboard Template
- [ ] Create `templates/cribbage-board.html` with:
  - [ ] Split-screen layout for two players
  - [ ] Score display
  - [ ] Game state indicators
  - [ ] Real-time updates via SSE
  - [ ] Material Design 3 card components
  - [ ] Responsive design for mobile

### ✅ 3.3 Player Controller Template
- [ ] Create `templates/cribbage-controller.html` with:
  - [ ] Player hand display
  - [ ] Card selection interface
  - [ ] Action buttons (play card, discard, etc.)
  - [ ] Score tracking
  - [ ] Real-time updates via SSE
  - [ ] Mobile-optimized touch interface

### ✅ 3.4 CSS Implementation
- [ ] Implement main styles in `styles.css`:
  - [ ] Material Design 3 integration
  - [ ] Color scheme matching WoodHome theme
  - [ ] Typography consistency
  - [ ] Component styling (cards, buttons, forms)
- [ ] Implement board styles in `board.css`:
  - [ ] Gameboard layout
  - [ ] Card positioning
  - [ ] Score display
  - [ ] Player areas
- [ ] Implement controller styles in `controller.css`:
  - [ ] Hand display
  - [ ] Card selection states
  - [ ] Action buttons
  - [ ] Mobile touch targets
- [ ] Implement animations in `animations.css`:
  - [ ] Card flip animations
  - [ ] Card play animations
  - [ ] Score update animations
  - [ ] Loading animations
- [ ] Implement responsive design in `responsive.css`:
  - [ ] Mobile breakpoints
  - [ ] Tablet optimization
  - [ ] Touch-friendly interfaces

### ✅ 3.5 JavaScript Implementation
- [ ] Implement `main.js`:
  - [ ] Application initialization
  - [ ] Event listener setup
  - [ ] HTMX integration
  - [ ] Error handling
- [ ] Implement `gameState.js`:
  - [ ] Game state management
  - [ ] Player data handling
  - [ ] Score tracking
  - [ ] Phase management
- [ ] Implement `cribbageLogic.js`:
  - [ ] Card dealing logic
  - [ ] Scoring calculations
  - [ ] Game rules enforcement
  - [ ] Win condition checking
- [ ] Implement `signalr.js`:
  - [ ] SSE connection management
  - [ ] Real-time update handling
  - [ ] Connection error handling
  - [ ] Reconnection logic
- [ ] Implement `cardAnimations.js`:
  - [ ] Card flip animations
  - [ ] Card play animations
  - [ ] Score update animations
  - [ ] Transition effects

---

## Phase 4: Email Integration (Week 4)

### ✅ 4.1 Email Service Setup
- [ ] Add email dependencies to `go.mod`:
  ```bash
  go get gopkg.in/gomail.v2
  ```
- [ ] Create email service struct in `main.go`:
  ```go
  type EmailService struct {
      smtpHost     string
      smtpPort     int
      fromEmail    string
      fromPassword string
  }
  ```
- [ ] Add email configuration to `WoodHomeConfig`:
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
- [ ] Create email templates directory: `templates/email/`
- [ ] Create `templates/email/game-invite.html` - Game invitation email
- [ ] Create `templates/email/game-ready.html` - Game ready notification
- [ ] Create `templates/email/game-update.html` - Game state updates

### ✅ 4.3 Email Service Implementation
- [ ] Implement `SendGameInvite(toEmail, gameID, token string) error`
- [ ] Implement `SendGameReady(player1Email, player2Email, gameID, token1, token2 string) error`
- [ ] Implement `SendGameUpdate(playerEmail, gameID string, update GameUpdate) error`
- [ ] Add email template rendering
- [ ] Add SMTP connection handling
- [ ] Add error handling and logging

### ✅ 4.4 Environment Configuration
- [ ] Add email environment variables to `.env.example`:
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
1. **Route Registration**: Add cribbage routes following existing pattern
2. **Template System**: Use existing Go template system
3. **Static Assets**: Follow existing static file organization
4. **Material Design**: Integrate with existing Material Design 3 theme
5. **HTMX Integration**: Use existing HTMX patterns for dynamic updates
6. **Error Handling**: Follow existing error handling patterns

### Database Considerations
- SQLite for local development and testing
- Consider PostgreSQL for production
- Implement proper connection pooling
- Add database migration scripts

### Security Considerations
- Validate all user inputs
- Sanitize email addresses
- Implement rate limiting for API endpoints
- Secure token generation and validation
- Add CSRF protection for forms

### Performance Considerations
- Implement connection pooling for database
- Add caching for frequently accessed data
- Optimize SSE connections
- Implement proper cleanup for disconnected clients
- Add database indexing for performance

### Mobile Optimization
- Touch-friendly card interfaces
- Responsive design for all screen sizes
- Optimize for mobile data usage
- Implement offline capabilities where possible
- Test on various mobile devices

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
