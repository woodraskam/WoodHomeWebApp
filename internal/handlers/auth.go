package handlers

import (
	"net/http"
	"os"

	"woodhome-webapp/internal/services"

	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

var (
	oauthConfig  = services.NewGoogleOAuthConfig()
	sessionStore = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
)

// GoogleLoginHandler initiates the OAuth login flow
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

	// Store token in session
	session.Values["oauth_token"] = token
	session.Options.MaxAge = 30 * 24 * 60 * 60 // 30 days
	session.Save(r, w)

	// Redirect to calendar page
	http.Redirect(w, r, "/calendar", http.StatusSeeOther)
}

// LogoutHandler clears the session and logs out the user
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := sessionStore.Get(r, "auth-session")
	session.Options.MaxAge = -1 // Delete the cookie
	session.Save(r, w)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}
