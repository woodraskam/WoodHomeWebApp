package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"woodhome-webapp/internal/services"

	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	_ "modernc.org/sqlite"
)

var (
	sessionStore *sessions.CookieStore
)

// GetSessionStore creates session store dynamically
func GetSessionStore() *sessions.CookieStore {
	if sessionStore == nil {
		sessionStore = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
	}
	return sessionStore
}

// getOAuthConfig creates OAuth config dynamically
func getOAuthConfig() *oauth2.Config {
	return services.NewGoogleOAuthConfig()
}

// GoogleLoginHandler initiates the OAuth login flow
func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	oauthConfig := getOAuthConfig()

	// Debug: Log OAuth configuration
	log.Printf("OAuth Config - ClientID: %s", oauthConfig.ClientID)
	log.Printf("OAuth Config - RedirectURL: %s", oauthConfig.RedirectURL)

	// Generate state token for CSRF protection
	state, err := services.GenerateStateToken()
	if err != nil {
		http.Error(w, "Failed to generate state token", http.StatusInternalServerError)
		return
	}

	// Store state in session (expires in 10 minutes)
	session, _ := GetSessionStore().Get(r, "auth-session")
	session.Values["oauth_state"] = state
	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   600, // 10 minutes
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	session.Save(r, w)

	// Redirect to Google's OAuth page
	// CRITICAL: Use AccessTypeOffline to get refresh token
	url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// GoogleCallbackHandler handles the OAuth callback
func GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	// Retrieve state from session
	session, _ := GetSessionStore().Get(r, "auth-session")
	storedState, ok := session.Values["oauth_state"].(string)

	// Debug: Log state validation
	queryState := r.URL.Query().Get("state")
	log.Printf("Callback - Query State: %s", queryState)
	log.Printf("Callback - Stored State: %s", storedState)
	log.Printf("Callback - State OK: %v", ok)

	// Validate state token (CSRF protection)
	if !ok || queryState != storedState {
		log.Printf("State validation failed - Query: %s, Stored: %s, OK: %v", queryState, storedState, ok)
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	// Clear state token (one-time use)
	delete(session.Values, "oauth_state")

	// Exchange authorization code for access token
	code := r.URL.Query().Get("code")
	oauthConfig := getOAuthConfig()
	token, err := oauthConfig.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}

	// Store token in SQLite database
	userID := 1
	err = saveOAuthTokenToSQLite(userID, token)
	if err != nil {
		log.Printf("Failed to save OAuth token to SQLite: %v", err)
		http.Error(w, "Failed to save token", http.StatusInternalServerError)
		return
	}

	// Store simple authentication flag in session
	session.Values["oauth_authenticated"] = true
	session.Values["user_id"] = userID
	session.Options.MaxAge = 30 * 24 * 60 * 60 // 30 days
	err = session.Save(r, w)
	if err != nil {
		log.Printf("Failed to save session: %v", err)
		http.Error(w, "Failed to save session", http.StatusInternalServerError)
		return
	}

	log.Printf("OAuth token stored in memory for user %d", userID)

	log.Printf("OAuth token stored successfully, redirecting to SPA dashboard")
	// Redirect to SPA dashboard with success parameter
	http.Redirect(w, r, "/?auth=success", http.StatusSeeOther)
}

// LogoutHandler clears the session and logs out the user
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := GetSessionStore().Get(r, "auth-session")
	session.Options.MaxAge = -1 // Delete the cookie
	session.Save(r, w)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// SQLite database functions for OAuth token storage
func saveOAuthTokenToSQLite(userID int, token *oauth2.Token) error {
	// Open SQLite database
	db, err := sql.Open("sqlite", "./oauth_tokens.db")
	if err != nil {
		return err
	}
	defer db.Close()

	// Create table if not exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS oauth_tokens (
			user_id INTEGER PRIMARY KEY,
			access_token TEXT NOT NULL,
			refresh_token TEXT,
			token_type TEXT DEFAULT 'Bearer',
			expiry DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Insert or update token
	_, err = db.Exec(`
		INSERT OR REPLACE INTO oauth_tokens 
		(user_id, access_token, refresh_token, token_type, expiry, updated_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`, userID, token.AccessToken, token.RefreshToken, token.TokenType, token.Expiry.Format(time.RFC3339))

	return err
}

func getOAuthTokenFromSQLite(userID int) (*oauth2.Token, error) {
	// Open SQLite database
	db, err := sql.Open("sqlite", "./oauth_tokens.db")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var accessToken, refreshToken, tokenType, expiryStr string
	err = db.QueryRow(`
		SELECT access_token, refresh_token, token_type, expiry 
		FROM oauth_tokens WHERE user_id = ?
	`, userID).Scan(&accessToken, &refreshToken, &tokenType, &expiryStr)

	if err != nil {
		return nil, err
	}

	// Parse expiry
	expiry, err := time.Parse(time.RFC3339, expiryStr)
	if err != nil {
		return nil, err
	}

	return &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		Expiry:       expiry,
	}, nil
}
