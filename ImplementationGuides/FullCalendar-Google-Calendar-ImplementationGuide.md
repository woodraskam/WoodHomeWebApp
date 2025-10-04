# FULLY RESEARCHED Implementation Guide: Google Calendar Integration with FullCalendar in Go

## Project Context
- **Backend**: Go with standard library net/http and Gorilla Mux router
- **Architecture**: Existing handlers/models/services package structure  
- **Frontend**: Vanilla JavaScript with FullCalendar v6 (MIT licensed, free version)
- **Goal**: Phase 1 - Read-only calendar display; Phase 2 - Create/edit events
- **Authentication**: Google OAuth 2.0 for Google Calendar API access
- **Developer Profile**: Familiar with JS/web standards, new to FullCalendar and Google OAuth

---

## Prerequisites Checklist

### 1. Google Cloud Project Setup
- [ ] Navigate to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project or select existing project
- [ ] Enable Google Calendar API:
  - Go to "APIs & Services" > "Library"
  - Search for "Google Calendar API"
  - Click "ENABLE"
- [ ] Configure OAuth Consent Screen:
  - Go to "APIs & Services" > "OAuth consent screen"
  - Select "Internal" (for company use) or "External" (for public)
  - Fill in App name, User support email, Developer contact
  - Add scopes: `https://www.googleapis.com/auth/calendar.readonly` (Phase 1)
  - Note: For Phase 2, you'll need `https://www.googleapis.com/auth/calendar` instead
- [ ] Create OAuth 2.0 Credentials:
  - Go to "APIs & Services" > "Credentials"
  - Click "Create Credentials" > "OAuth client ID"
  - Application type: "Web application"
  - Authorized redirect URIs: `http://localhost:PORT/auth/google/callback`
  - Download credentials JSON or copy Client ID and Secret
- [ ] Add credentials to `.env` file:
  ```env
  GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your_client_secret_here
  GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
  SESSION_KEY=your_random_32_byte_key_here
  ```

### 2. Go Dependencies to Install
```bash
# OAuth2 and Google APIs
go get golang.org/x/oauth2
go get golang.org/x/oauth2/google
go get google.golang.org/api/calendar/v3
go get google.golang.org/api/option

# Session management (choose one approach)
# Option A: Gorilla Sessions (simpler, good for single-server)
go get github.com/gorilla/sessions

# Option B: SCS (more features, better for production)
# go get github.com/alexedwards/scs/v2

# UUID for state tokens
go get github.com/google/uuid
```

### 3. Frontend Dependencies
FullCalendar v6 can be loaded via CDN (recommended for simplicity):
```html
<!-- FullCalendar Core -->
<link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js'></script>
```

---

## Architecture Overview

### OAuth Flow Diagram
```
User clicks "Connect Calendar"
    ↓
/auth/google/login handler
    ↓ Generates state token, stores in session
    ↓ Redirects to Google's authorization page
    ↓
User grants permission on Google's page
    ↓
Google redirects to /auth/google/callback with code
    ↓
Callback handler validates state, exchanges code for tokens
    ↓ Stores tokens (encrypted session or DB)
    ↓
Redirects to /calendar page
```

### Calendar Display Flow
```
/calendar page loads
    ↓
Check authentication (session/cookie has tokens?)
    ↓ NO → Redirect to /auth/google/login
    ↓ YES → Render calendar.html
    ↓
FullCalendar initializes in browser
    ↓
Fetches events via: GET /api/calendar/events?start=...&end=...
    ↓
Backend handler checks token, refreshes if expired
    ↓
Calls Google Calendar API
    ↓
Returns JSON array to frontend
    ↓
FullCalendar renders events
```

---

## Implementation Checklist

### PHASE 1: OAuth Authentication Setup

#### Step 1.1: Create OAuth Configuration Service (`services/oauth.go`)

**Purpose**: Centralize OAuth configuration and utilities

**Key Implementation Points**:
- Use `oauth2.Config` from `golang.org/x/oauth2`
- Endpoint: `google.Endpoint` from `golang.org/x/oauth2/google`
- Scope for Phase 1: `calendar.CalendarReadonlyScope`
- **CRITICAL**: Always use `oauth2.AccessTypeOffline` to get refresh tokens
- State token: Use `crypto/rand` for cryptographically secure random generation

**Code Example**:
```go
package services

import (
    "crypto/rand"
    "encoding/base64"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "google.golang.org/api/calendar/v3"
    "os"
)

func NewGoogleOAuthConfig() *oauth2.Config {
    return &oauth2.Config{
        ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
        RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
        Scopes: []string{
            calendar.CalendarReadonlyScope,
        },
        Endpoint: google.Endpoint,
    }
}

// GenerateStateToken creates a cryptographically secure random state token
func GenerateStateToken() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}
```

**Checklist**:
- [ ] Create `services/oauth.go` file
- [ ] Implement `NewGoogleOAuthConfig()` function
- [ ] Implement `GenerateStateToken()` function
- [ ] Load config from environment variables
- [ ] Use `oauth2.AccessTypeOffline` to ensure refresh tokens

---

#### Step 1.2: Create OAuth Handlers (`handlers/auth.go`)

**Purpose**: Handle the OAuth login flow and callback

**Security Considerations**:
- **State token CSRF protection**: Generate unique state token per request
- Store state in secure, HttpOnly cookie with 10-minute expiration
- Always validate state token in callback
- Clear state token after use

**Code Example - Login Handler**:
```go
package handlers

import (
    "net/http"
    "time"
    "yourapp/services"
    "github.com/gorilla/sessions"
)

var (
    oauthConfig  = services.NewGoogleOAuthConfig()
    sessionStore = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
)

func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
    // Generate state token for CSRF protection
    state, err := services.GenerateStateToken()
    if err != nil {
        http.Error(w, "Failed to generate state token", http.StatusInternalServerError)
        return
    }
    
    // Store state in session (expires in 10 minutes)
    session, _ := sessionStore.Get(r, "auth-session")
    session.Values["oauth_state"] = state
    session.Options = &sessions.Options{
        Path:     "/",
        MaxAge:   600,  // 10 minutes
        HttpOnly: true,
        Secure:   false,  // Set to true in production with HTTPS
        SameSite: http.SameSiteLaxMode,
    }
    session.Save(r, w)
    
    // Redirect to Google's OAuth page
    // CRITICAL: Use AccessTypeOffline to get refresh token
    url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}
```

**Code Example - Callback Handler**:
```go
func GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
    // Retrieve state from session
    session, _ := sessionStore.Get(r, "auth-session")
    storedState, ok := session.Values["oauth_state"].(string)
    
    // Validate state token (CSRF protection)
    queryState := r.URL.Query().Get("state")
    if !ok || queryState != storedState {
        http.Error(w, "Invalid state parameter", http.StatusBadRequest)
        return
    }
    
    // Clear state token (one-time use)
    delete(session.Values, "oauth_state")
    
    // Exchange authorization code for access token
    code := r.URL.Query().Get("code")
    token, err := oauthConfig.Exchange(r.Context(), code)
    if err != nil {
        http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
        return
    }
    
    // Store token in session or database
    // Option A: Store in session (simpler)
    session.Values["oauth_token"] = token
    session.Options.MaxAge = 30 * 24 * 60 * 60  // 30 days
    session.Save(r, w)
    
    // Option B: Store in database (more scalable)
    // userID := getUserID(r)  // Implement based on your auth system
    // err = saveTokenToDB(userID, token)
    
    // Redirect to calendar page
    http.Redirect(w, r, "/calendar", http.StatusSeeOther)
}
```

**Checklist**:
- [ ] Create `handlers/auth.go` file
- [ ] Initialize session store with secure random key (32+ bytes)
- [ ] Implement `GoogleLoginHandler` with state generation
- [ ] Implement `GoogleCallbackHandler` with state validation
- [ ] Store tokens securely (encrypted or HttpOnly cookies)
- [ ] Add error handling for all OAuth steps
- [ ] Clear sensitive data from sessions after use

**Common Pitfalls to Avoid**:
- ❌ Not using `oauth2.AccessTypeOffline` → Won't get refresh token
- ❌ Skipping state validation → Vulnerable to CSRF attacks  
- ❌ Storing tokens in localStorage → XSS vulnerability
- ❌ Not setting `HttpOnly` cookie flag → XSS vulnerability
- ❌ Weak session keys → Session hijacking risk

---

#### Step 1.3: Token Storage Model (`models/oauth_token.go`)

**Purpose**: Define structure for storing OAuth tokens persistently

**Two Approaches**:

**Approach A: Session-Only Storage** (Simpler, good for single-server apps)
- Tokens stored in encrypted cookies via Gorilla Sessions
- No database needed
- User must re-auth if they clear cookies
- Best for: Development, small apps, single-server deployments

**Approach B: Database Storage** (Production-grade, scalable)
- Tokens stored in database with user association
- Survives cookie deletion
- Required for multi-server deployments
- Best for: Production apps, multi-server setups

**Database Schema Example**:
```sql
CREATE TABLE oauth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    access_token VARCHAR(512) NOT NULL,
    refresh_token VARCHAR(512),
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expiry DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id),
    INDEX idx_expiry (expiry)
);
```

**Model Structure**:
```go
package models

import (
    "time"
    "golang.org/x/oauth2"
)

type OAuthToken struct {
    ID           int       `json:"id"`
    UserID       int       `json:"user_id"`
    AccessToken  string    `json:"-"` // Never expose in JSON
    RefreshToken string    `json:"-"` // Never expose in JSON
    TokenType    string    `json:"token_type"`
    Expiry       time.Time `json:"expiry"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

// ToOAuth2Token converts DB model to oauth2.Token
func (t *OAuthToken) ToOAuth2Token() *oauth2.Token {
    return &oauth2.Token{
        AccessToken:  t.AccessToken,
        RefreshToken: t.RefreshToken,
        TokenType:    t.TokenType,
        Expiry:       t.Expiry,
    }
}

// FromOAuth2Token creates OAuthToken from oauth2.Token
func FromOAuth2Token(userID int, token *oauth2.Token) *OAuthToken {
    return &OAuthToken{
        UserID:       userID,
        AccessToken:  token.AccessToken,
        RefreshToken: token.RefreshToken,
        TokenType:    token.TokenType,
        Expiry:       token.Expiry,
    }
}
```

**Database Operations** (`models/oauth_token.go` continued):
```go
// SaveToken stores or updates token in database
func SaveToken(db *sql.DB, token *OAuthToken) error {
    query := `
        INSERT INTO oauth_tokens (user_id, access_token, refresh_token, token_type, expiry)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            token_type = VALUES(token_type),
            expiry = VALUES(expiry),
            updated_at = CURRENT_TIMESTAMP
    `
    _, err := db.Exec(query, token.UserID, token.AccessToken, 
                      token.RefreshToken, token.TokenType, token.Expiry)
    return err
}

// GetToken retrieves token by user ID
func GetToken(db *sql.DB, userID int) (*OAuthToken, error) {
    query := `SELECT id, user_id, access_token, refresh_token, token_type, expiry 
              FROM oauth_tokens WHERE user_id = ?`
    
    var token OAuthToken
    err := db.QueryRow(query, userID).Scan(
        &token.ID, &token.UserID, &token.AccessToken,
        &token.RefreshToken, &token.TokenType, &token.Expiry,
    )
    if err != nil {
        return nil, err
    }
    return &token, nil
}
```

**Checklist**:
- [ ] Create `models/oauth_token.go` file
- [ ] Define `OAuthToken` struct
- [ ] Create database table (if using DB storage)
- [ ] Implement `SaveToken()` and `GetToken()` functions
- [ ] Add token encryption for database storage (optional but recommended)
- [ ] Never expose tokens in JSON responses

---

#### Step 1.4: Register OAuth Routes (`main.go`)

**Purpose**: Wire up OAuth handlers to URL routes

**Code Example**:
```go
package main

import (
    "log"
    "net/http"
    "github.com/gorilla/mux"
    "yourapp/internal/handlers"
)

func main() {
    r := mux.NewRouter()
    
    // OAuth routes
    r.HandleFunc("/auth/google/login", handlers.GoogleLoginHandler).Methods("GET")
    r.HandleFunc("/auth/google/callback", handlers.GoogleCallbackHandler).Methods("GET")
    r.HandleFunc("/auth/logout", handlers.LogoutHandler).Methods("POST")
    
    // Calendar routes (will add later)
    r.HandleFunc("/calendar", handlers.CalendarPageHandler).Methods("GET")
    r.HandleFunc("/api/calendar/events", handlers.GetEventsHandler).Methods("GET")
    
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

**Checklist**:
- [ ] Add OAuth routes to main router
- [ ] Use `.Methods()` to restrict HTTP verbs
- [ ] Add logout handler for cleanup
- [ ] Test OAuth flow manually before proceeding

---

### PHASE 2: Calendar Service Layer

#### Step 2.1: Create Calendar Service (`services/calendar.go`)

**Purpose**: Interact with Google Calendar API to fetch events

**Key Concepts**:
- **Token Refresh**: Google tokens expire after ~1 hour, must check and refresh
- **Calendar ID**: Use `"primary"` for user's main calendar
- **Time Range**: FullCalendar sends start/end as ISO 8601 strings
- **Rate Limits**: Google Calendar API allows ~1M queries/day (10/sec default)

**Token Refresh Strategy**:
```go
package services

import (
    "context"
    "time"
    "golang.org/x/oauth2"
    "google.golang.org/api/calendar/v3"
    "google.golang.org/api/option"
)

// CalendarEvent is a simplified event structure for frontend
type CalendarEvent struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Start       string    `json:"start"`
    End         string    `json:"end"`
    Description string    `json:"description,omitempty"`
    Color       string    `json:"color,omitempty"`
    AllDay      bool      `json:"allDay,omitempty"`
}

// GetCalendarEvents fetches events from Google Calendar
func GetCalendarEvents(ctx context.Context, token *oauth2.Token, start, end time.Time) ([]CalendarEvent, error) {
    // Refresh token if expired
    if token.Expiry.Before(time.Now()) {
        tokenSource := oauthConfig.TokenSource(ctx, token)
        newToken, err := tokenSource.Token()
        if err != nil {
            return nil, err
        }
        *token = *newToken  // Update token in-place
        // TODO: Save updated token to session/database
    }
    
    // Create authenticated HTTP client
    client := oauthConfig.Client(ctx, token)
    
    // Create Calendar service
    srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
    if err != nil {
        return nil, err
    }
    
    // Fetch events from primary calendar
    events, err := srv.Events.List("primary").
        TimeMin(start.Format(time.RFC3339)).
        TimeMax(end.Format(time.RFC3339)).
        SingleEvents(true).
        OrderBy("startTime").
        MaxResults(2500).  // FullCalendar can handle this
        Do()
    
    if err != nil {
        return nil, err
    }
    
    // Transform to simplified format
    var calEvents []CalendarEvent
    for _, item := range events.Items {
        event := CalendarEvent{
            ID:          item.Id,
            Title:       item.Summary,
            Description: item.Description,
            Color:       getEventColor(item),  // Custom function
        }
        
        // Handle all-day vs timed events
        if item.Start.Date != "" {
            event.Start = item.Start.Date
            event.End = item.End.Date
            event.AllDay = true
        } else {
            event.Start = item.Start.DateTime
            event.End = item.End.DateTime
            event.AllDay = false
        }
        
        calEvents = append(calEvents, event)
    }
    
    return calEvents, nil
}

// getEventColor extracts color from Google Calendar event
func getEventColor(item *calendar.Event) string {
    // Google Calendar color IDs map to specific colors
    // You can map these to hex colors for FullCalendar
    colorMap := map[string]string{
        "1": "#a4bdfc", "2": "#7ae7bf", "3": "#dbadff",
        "4": "#ff887c", "5": "#fbd75b", "6": "#ffb878",
        "7": "#46d6db", "8": "#e1e1e1", "9": "#5484ed",
        "10": "#51b749", "11": "#dc2127",
    }
    if item.ColorId != "" {
        return colorMap[item.ColorId]
    }
    return "#3788d8"  // Default blue
}
```

**Checklist**:
- [ ] Create `services/calendar.go` file
- [ ] Implement `GetCalendarEvents()` function
- [ ] Add automatic token refresh logic
- [ ] Handle both all-day and timed events
- [ ] Transform Google events to FullCalendar format
- [ ] Add proper error handling
- [ ] Consider caching for performance (optional)

**Performance Tips**:
- Set `MaxResults` based on your needs (2500 is reasonable)
- Use `SingleEvents(true)` to expand recurring events
- Consider implementing caching with 5-minute TTL for busy calendars

---

#### Step 2.2: Create Calendar API Handler (`handlers/calendar_api.go`)

**Purpose**: Expose HTTP API endpoint for FullCalendar to fetch events

**FullCalendar Expected Request**:
```
GET /api/calendar/events?start=2025-10-01T00:00:00Z&end=2025-11-01T00:00:00Z
```

**FullCalendar Expected Response Format**:
```json
[
  {
    "id": "event123",
    "title": "Team Meeting",
    "start": "2025-10-05T10:00:00-05:00",
    "end": "2025-10-05T11:00:00-05:00",
    "description": "Weekly sync",
    "color": "#3788d8",
    "allDay": false
  },
  {
    "id": "event456",
    "title": "Conference",
    "start": "2025-10-10",
    "end": "2025-10-12",
    "allDay": true
  }
]
```

**Handler Implementation**:
```go
package handlers

import (
    "encoding/json"
    "net/http"
    "time"
    "yourapp/services"
)

func GetEventsHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Check authentication
    session, _ := sessionStore.Get(r, "auth-session")
    token, ok := session.Values["oauth_token"].(*oauth2.Token)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    // 2. Parse date range from query parameters
    startStr := r.URL.Query().Get("start")
    endStr := r.URL.Query().Get("end")
    
    start, err := time.Parse(time.RFC3339, startStr)
    if err != nil {
        http.Error(w, "Invalid start date", http.StatusBadRequest)
        return
    }
    
    end, err := time.Parse(time.RFC3339, endStr)
    if err != nil {
        http.Error(w, "Invalid end date", http.StatusBadRequest)
        return
    }
    
    // 3. Fetch events from Google Calendar
    events, err := services.GetCalendarEvents(r.Context(), token, start, end)
    if err != nil {
        // Check if token is invalid/revoked
        if err.Error() == "oauth2: token expired and refresh token is not set" {
            // User needs to re-authenticate
            http.Error(w, "Token expired, please login again", http.StatusUnauthorized)
            return
        }
        http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
        return
    }
    
    // 4. Return JSON response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(events)
}
```

**Checklist**:
- [ ] Create `handlers/calendar_api.go` file
- [ ] Implement `GetEventsHandler` function
- [ ] Parse query parameters (start, end)
- [ ] Validate date formats
- [ ] Call calendar service
- [ ] Handle token expiration gracefully
- [ ] Return proper JSON response
- [ ] Add CORS headers if frontend on different domain

---

#### Step 2.3: Authentication Middleware

**Purpose**: Protect calendar routes, require valid OAuth token

**Middleware Pattern**:
```go
package handlers

func AuthRequired(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        session, _ := sessionStore.Get(r, "auth-session")
        token, ok := session.Values["oauth_token"].(*oauth2.Token)
        
        if !ok || token == nil {
            // Not authenticated, redirect to login
            http.Redirect(w, r, "/auth/google/login", http.StatusSeeOther)
            return
        }
        
        // Token exists, proceed
        next(w, r)
    }
}
```

**Apply to Routes**:
```go
// In main.go
r.HandleFunc("/calendar", AuthRequired(handlers.CalendarPageHandler)).Methods("GET")
r.HandleFunc("/api/calendar/events", AuthRequired(handlers.GetEventsHandler)).Methods("GET")
```

**Checklist**:
- [ ] Create authentication middleware
- [ ] Check for valid token in session
- [ ] Redirect to login if not authenticated
- [ ] Apply middleware to protected routes

---

### PHASE 3: Frontend Calendar Page

#### Step 3.1: Create Calendar HTML Template (`templates/calendar.html`)

**Purpose**: Render the calendar UI with FullCalendar

**Complete Template Example**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Calendar</title>
    
    <!-- FullCalendar CSS -->
    <link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.css' rel='stylesheet' />
    
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
            font-size: 14px;
        }
        #calendar {
            max-width: 1100px;
            margin: 0 auto;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .error {
            background-color: #fee;
            color: #c00;
            padding: 10px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>My Google Calendar</h1>
    <div id="calendar"></div>
    <div id="loading" class="loading" style="display:none;">Loading events...</div>
    <div id="error" class="error" style="display:none;"></div>
    
    <!-- FullCalendar JS -->
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js'></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');
            var loadingEl = document.getElementById('loading');
            var errorEl = document.getElementById('error');
            
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                
                // Time zone handling
                timeZone: 'local',  // Use browser's timezone
                
                // Event source - dynamic loading from backend
                events: function(info, successCallback, failureCallback) {
                    loadingEl.style.display = 'block';
                    errorEl.style.display = 'none';
                    
                    // Fetch events from your API
                    fetch(`/api/calendar/events?start=${info.startStr}&end=${info.endStr}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            loadingEl.style.display = 'none';
                            successCallback(data);
                        })
                        .catch(error => {
                            loadingEl.style.display = 'none';
                            errorEl.textContent = 'Failed to load events: ' + error.message;
                            errorEl.style.display = 'block';
                            failureCallback(error);
                        });
                },
                
                // Event click handler (for Phase 2)
                eventClick: function(info) {
                    alert('Event: ' + info.event.title);
                    // Phase 2: Open edit modal
                },
                
                // Loading indicator
                loading: function(isLoading) {
                    loadingEl.style.display = isLoading ? 'block' : 'none';
                }
            });
            
            calendar.render();
        });
    </script>
</body>
</html>
```

**FullCalendar Configuration Options Explained**:

- **`initialView`**: Starting calendar view (month/week/day)
- **`headerToolbar`**: Navigation buttons and view switchers
- **`timeZone`**: 
  - `'local'` - Use browser's timezone (recommended)
  - `'UTC'` - Display all times in UTC
  - Named timezone like `'America/Chicago'`
- **`events` function**: 
  - Called whenever calendar needs events (view change, prev/next)
  - Receives `info` object with `startStr` and `endStr` (ISO 8601 dates)
  - Call `successCallback(events)` with event array
  - Call `failureCallback(error)` on error
- **`eventClick`**: Handler for when user clicks an event

**Checklist**:
- [ ] Create `templates/calendar.html` file
- [ ] Include FullCalendar CSS and JS from CDN
- [ ] Add calendar container div
- [ ] Initialize FullCalendar with proper config
- [ ] Implement dynamic event loading via `events` function
- [ ] Add loading and error states
- [ ] Test in browser

**Common FullCalendar Gotchas**:
- ❌ Using `events: '/api/...'` (string URL) - Works but less flexible
- ✅ Using `events: function()` - Allows custom error handling
- ❌ Not handling timezone - Events may show at wrong times
- ✅ Set `timeZone: 'local'` for user's timezone
- ❌ Forgetting to call `successCallback` - Events won't render

---

#### Step 3.2: Create Calendar Page Handler (`handlers/calendar.go`)

**Purpose**: Serve the calendar HTML page

**Simple Implementation**:
```go
package handlers

import (
    "html/template"
    "net/http"
)

func CalendarPageHandler(w http.ResponseWriter, r *http.Request) {
    // This handler is already protected by AuthRequired middleware
    tmpl, err := template.ParseFiles("templates/calendar.html")
    if err != nil {
        http.Error(w, "Failed to load template", http.StatusInternalServerError)
        return
    }
    
    tmpl.Execute(w, nil)
}
```

**Checklist**:
- [ ] Create `handlers/calendar.go` file (if not already created)
- [ ] Implement `CalendarPageHandler` function
- [ ] Use Go's `html/template` package
- [ ] Ensure middleware protects this route
- [ ] Test page loads in browser

---

### PHASE 4: Testing & Refinement

#### Step 4.1: Manual Testing Checklist

**OAuth Flow Testing**:
- [ ] Visit `/auth/google/login`
- [ ] Redirects to Google's login page
- [ ] After login, redirects back to `/auth/google/callback`
- [ ] Successfully exchanges code for token
- [ ] Stores token in session
- [ ] Redirects to `/calendar` page

**Calendar Display Testing**:
- [ ] `/calendar` page loads without errors
- [ ] FullCalendar renders correctly
- [ ] Initial month view loads events from Google
- [ ] Click "prev" - previous month's events load
- [ ] Click "next" - next month's events load
- [ ] Switch to week view - events display correctly
- [ ] Switch to day view - events display correctly
- [ ] All-day events show in correct format
- [ ] Timed events show with correct start/end times
- [ ] Event colors match Google Calendar

**Error Handling Testing**:
- [ ] Expired token automatically refreshes
- [ ] Invalid token redirects to login
- [ ] Network errors display user-friendly message
- [ ] Empty date ranges return empty array (not error)

**Security Testing**:
- [ ] Cannot access `/calendar` without authentication
- [ ] State token validation prevents CSRF
- [ ] Session cookies have HttpOnly flag
- [ ] Tokens not visible in browser DevTools

---

#### Step 4.2: Token Refresh Testing

**Scenario**: Access token expires after 1 hour

**Test Steps**:
1. [ ] Login and view calendar successfully
2. [ ] Wait for token to expire (or manually set expiry to past)
3. [ ] Refresh calendar or navigate to different month
4. [ ] Backend should automatically refresh token
5. [ ] Events should load without requiring re-login

**Implementation Check**:
```go
// In services/calendar.go GetCalendarEvents function
if token.Expiry.Before(time.Now()) {
    tokenSource := oauthConfig.TokenSource(ctx, token)
    newToken, err := tokenSource.Token()
    if err != nil {
        return nil, err
    }
    *token = *newToken
    // IMPORTANT: Save updated token back to session/database
}
```

---

#### Step 4.3: Edge Cases to Handle

**Empty Calendar**:
- [ ] User has no events in date range
- [ ] API returns empty array `[]`
- [ ] Frontend displays empty calendar (not error)

**Network Failures**:
- [ ] Google API is temporarily down
- [ ] Display user-friendly error message
- [ ] Allow retry without full page refresh

**Multiple Calendars** (Future Enhancement):
- [ ] User has multiple Google Calendars
- [ ] Currently using `"primary"` only
- [ ] Phase 2 could add multi-calendar support

**Recurring Events**:
- [ ] Google handles recurrence expansion with `SingleEvents(true)`
- [ ] Each instance appears as separate event
- [ ] Test: Create recurring event in Google, verify shows correctly

**Timezone Confusion**:
- [ ] User's browser timezone vs Google Calendar timezone
- [ ] Set FullCalendar `timeZone: 'local'` to use browser timezone
- [ ] Test: Create event at specific time, verify displays correctly

---

### PHASE 5: Production Considerations

#### Step 5.1: Security Hardening

**Environment Variables**:
- [ ] Never commit `.env` file to git
- [ ] Use strong random SESSION_KEY (32+ bytes)
- [ ] Rotate SESSION_KEY periodically

**HTTPS Requirements**:
- [ ] Google OAuth REQUIRES https in production
- [ ] Update redirect URL to `https://yourdomain.com/auth/google/callback`
- [ ] Set cookie `Secure: true` flag
- [ ] Consider using Let's Encrypt for free SSL

**Token Storage**:
- [ ] Encrypt tokens in database (use AES-256)
- [ ] Never log tokens
- [ ] Implement token revocation on logout

**Rate Limiting**:
- [ ] Add rate limiting to API endpoints
- [ ] Prevent abuse of Google Calendar API quota
- [ ] Consider: github.com/didip/tollbooth

**CORS** (if frontend on different domain):
- [ ] Configure allowed origins
- [ ] Set credentials: true for cookies
- [ ] Whitelist specific methods

---

#### Step 5.2: Performance Optimization

**Caching Strategy**:
```go
// Simple in-memory cache with 5-minute TTL
type CachedEvents struct {
    Events    []services.CalendarEvent
    CachedAt  time.Time
}

var eventCache = make(map[string]*CachedEvents)

func getCachedEvents(userID int, start, end time.Time) []services.CalendarEvent {
    cacheKey := fmt.Sprintf("%d:%s:%s", userID, start.Format(time.RFC3339), end.Format(time.RFC3339))
    
    if cached, ok := eventCache[cacheKey]; ok {
        if time.Since(cached.CachedAt) < 5*time.Minute {
            return cached.Events
        }
    }
    return nil
}
```

**Database Indexing**:
- [ ] Index on `user_id` in oauth_tokens table
- [ ] Index on `expiry` for cleanup queries

**Connection Pooling**:
- [ ] Configure database connection pool
- [ ] Set max idle connections: 10
- [ ] Set max open connections: 100

---

#### Step 5.3: Monitoring & Logging

**Log Important Events**:
- [ ] OAuth login attempts
- [ ] Token refresh operations
- [ ] API errors
- [ ] Rate limit hits

**Metrics to Track**:
- [ ] OAuth success/failure rate
- [ ] Token refresh frequency
- [ ] API response times
- [ ] Calendar API quota usage

**Error Alerting**:
- [ ] High rate of authentication failures
- [ ] Google API quota approaching limit
- [ ] Database connection issues

---

## PHASE 2 PREVIEW: Create/Edit Events (Future)

### When Ready to Add Write Functionality:

**1. Update OAuth Scopes**:
```go
// In services/oauth.go
Scopes: []string{
    calendar.CalendarScope,  // Changed from CalendarReadonlyScope
},
```
⚠️ **Note**: Users must re-authorize when scopes change

**2. Add Create Event Endpoint**:
```go
// POST /api/calendar/events
func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
    // Parse request body
    // Call Google Calendar API Insert method
    // Return created event
}
```

**3. FullCalendar Configuration**:
```javascript
var calendar = new FullCalendar.Calendar(calendarEl, {
    // ... existing config
    editable: true,           // Enable drag/resize
    selectable: true,         // Enable date selection
    
    select: function(info) {
        // User selected date range
        // Open modal to create event
        var title = prompt('Event Title:');
        if (title) {
            fetch('/api/calendar/events', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    title: title,
                    start: info.startStr,
                    end: info.endStr
                })
            }).then(response => response.json())
              .then(() => calendar.refetchEvents());
        }
    },
    
    eventClick: function(info) {
        // User clicked event
        // Open modal to edit/delete
    },
    
    eventDrop: function(info) {
        // User dragged event to new date
        updateEvent(info.event);
    }
});
```

**4. Event Form UI**:
- Create modal with form fields
- Title, start, end, description
- Color picker
- Calendar selection (if multiple calendars)

---

## Quick Reference

### Essential Files Structure
```
yourapp/
├── main.go                          # Route registration
├── .env                             # Environment variables
├── internal/
│   ├── handlers/
│   │   ├── auth.go                  # OAuth handlers
│   │   ├── calendar.go              # Calendar page handler
│   │   └── calendar_api.go          # Calendar API endpoints
│   ├── models/
│   │   └── oauth_token.go           # Token storage model
│   └── services/
│       ├── oauth.go                 # OAuth configuration
│       └── calendar.go              # Google Calendar API
└── templates/
    └── calendar.html                # Calendar UI
```

### Environment Variables
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
SESSION_KEY=your-random-32-byte-key
```

### API Endpoints Summary
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/google/login` | GET | No | Initiate OAuth flow |
| `/auth/google/callback` | GET | No | OAuth callback |
| `/auth/logout` | POST | Yes | Clear session |
| `/calendar` | GET | Yes | Render calendar page |
| `/api/calendar/events` | GET | Yes | Fetch events JSON |

### Common Commands
```bash
# Install dependencies
go get golang.org/x/oauth2 google.golang.org/api/calendar/v3 github.com/gorilla/sessions github.com/google/uuid

# Run server
go run main.go

# Build for production
go build -o calendar-app
```

---

## Troubleshooting Guide

### Problem: "redirect_uri_mismatch" error
**Cause**: Redirect URL doesn't match Google Cloud Console
**Solution**: 
- Check exact URL in Google Console
- Ensure protocol (http vs https) matches
- Ensure port matches
- Ensure no trailing slash differences

### Problem: Events not loading
**Debug Steps**:
1. Check browser console for errors
2. Check network tab - is `/api/calendar/events` returning 200?
3. Check Go server logs for errors
4. Verify token is present in session
5. Test Google Calendar API directly in browser

### Problem: "Invalid grant" error during token exchange
**Causes**:
- Clock skew between server and Google
- User revoked access
- Using same authorization code twice
**Solutions**:
- Sync server time with NTP
- User must re-authenticate
- Never reuse authorization codes

### Problem: Token refresh fails
**Cause**: No refresh token stored
**Solution**: 
- Ensure using `oauth2.AccessTypeOffline` in AuthCodeURL
- May need user to re-authenticate to get refresh token

### Problem: FullCalendar shows wrong times
**Cause**: Timezone mismatch
**Solution**:
- Set FullCalendar `timeZone: 'local'`
- Ensure API returns ISO 8601 with timezone
- Test with known event time

---

## Additional Resources

### Official Documentation
- **FullCalendar**: https://fullcalendar.io/docs
- **Google Calendar API**: https://developers.google.com/calendar/api/guides/overview
- **Go OAuth2 Package**: https://pkg.go.dev/golang.org/x/oauth2
- **Gorilla Mux**: https://github.com/gorilla/mux
- **Gorilla Sessions**: https://github.com/gorilla/sessions

### Google OAuth 2.0
- **OAuth 2.0 Overview**: https://developers.google.com/identity/protocols/oauth2
- **Web Server Flow**: https://developers.google.com/identity/protocols/oauth2/web-server
- **Best Practices**: https://developers.google.com/identity/protocols/oauth2/resources/best-practices

### Security Resources
- **OWASP Session Management**: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- **OAuth 2.0 Security**: https://datatracker.ietf.org/doc/html/rfc6819

---

## Final Notes

This guide prioritizes:
- ✅ **Security first**: Proper OAuth flow, CSRF protection, secure token storage
- ✅ **Developer experience**: Clear explanations, code examples, troubleshooting
- ✅ **Production readiness**: Error handling, token refresh, performance tips
- ✅ **Phase 1 focus**: Get read-only working first, extend later

**Next Steps After Implementing**:
1. Test thoroughly with manual testing checklist
2. Deploy to staging with HTTPS
3. Update Google OAuth redirect URL for production
4. Monitor OAuth success rates and API usage
5. Plan Phase 2 (create/edit) features

Good luck with your integration! 🚀