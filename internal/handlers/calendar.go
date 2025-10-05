package handlers

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"time"

	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
	"golang.org/x/oauth2"
)

// CalendarHandler handles HTTP requests for calendar operations
type CalendarHandler struct {
	calendarService *services.CalendarService
}

// NewCalendarHandler creates a new CalendarHandler instance
func NewCalendarHandler(calendarService *services.CalendarService) *CalendarHandler {
	return &CalendarHandler{
		calendarService: calendarService,
	}
}

// RegisterRoutes registers all calendar routes
func (h *CalendarHandler) RegisterRoutes(router *mux.Router) {
	calendarRouter := router.PathPrefix("/api/calendar").Subrouter()

	// Calendar API routes
	calendarRouter.HandleFunc("/events", h.GetEventsHandler).Methods("GET")
	calendarRouter.HandleFunc("/calendars", h.GetCalendarsHandler).Methods("GET")
	calendarRouter.HandleFunc("/colors", h.GetColorsHandler).Methods("GET")
}

// CalendarPageHandler serves the calendar HTML page
func (h *CalendarHandler) CalendarPageHandler(w http.ResponseWriter, r *http.Request) {
	// This handler is already protected by AuthRequired middleware
	tmpl, err := template.ParseFiles("templates/calendar.html")
	if err != nil {
		http.Error(w, "Failed to load template", http.StatusInternalServerError)
		return
	}

	tmpl.Execute(w, nil)
}

// GetEventsHandler fetches events from Google Calendar
func (h *CalendarHandler) GetEventsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check authentication
	session, _ := GetSessionStore().Get(r, "auth-session")
	authenticated, ok := session.Values["oauth_authenticated"].(bool)
	if !ok || !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get user ID from session
	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Error(w, "Invalid user session", http.StatusUnauthorized)
		return
	}

	// Get token from SQLite
	token, err := getOAuthTokenFromSQLite(userID)
	if err != nil {
		log.Printf("Failed to get token from SQLite: %v", err)
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Parse date range from query parameters
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

	// Fetch events from Google Calendar
	events, err := h.calendarService.GetCalendarEvents(r.Context(), token, start, end)
	if err != nil {
		log.Printf("Failed to fetch calendar events: %v", err)
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}

	// Save refreshed token back to SQLite if it was updated
	err = saveOAuthTokenToSQLite(userID, token)
	if err != nil {
		log.Printf("Failed to save refreshed token: %v", err)
		// Don't fail the request, just log the error
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

// AuthRequired middleware protects calendar routes
func AuthRequired(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := GetSessionStore().Get(r, "auth-session")
		authenticated, ok := session.Values["oauth_authenticated"].(bool)

		if !ok || !authenticated {
			// Not authenticated, redirect to login
			http.Redirect(w, r, "/auth/google/login", http.StatusSeeOther)
			return
		}

		// User is authenticated, proceed
		next(w, r)
	}
}

// GetCalendarsHandler fetches the user's calendar list with colors
func (h *CalendarHandler) GetCalendarsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check authentication
	session, _ := GetSessionStore().Get(r, "auth-session")
	authenticated, ok := session.Values["oauth_authenticated"].(bool)
	if !ok || !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Get OAuth token
	tokenData, ok := session.Values["oauth_token"].(string)
	if !ok || tokenData == "" {
		http.Error(w, "No OAuth token found", http.StatusUnauthorized)
		return
	}

	var token oauth2.Token
	if err := json.Unmarshal([]byte(tokenData), &token); err != nil {
		http.Error(w, "Invalid OAuth token", http.StatusUnauthorized)
		return
	}

	// 3. Fetch calendars
	calendars, err := h.calendarService.GetCalendars(r.Context(), &token)
	if err != nil {
		log.Printf("Failed to fetch calendars: %v", err)
		http.Error(w, "Failed to fetch calendars", http.StatusInternalServerError)
		return
	}

	// 4. Return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calendars)
}

// GetColorsHandler returns the Google Calendar color palette
func (h *CalendarHandler) GetColorsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check authentication
	session, _ := GetSessionStore().Get(r, "auth-session")
	authenticated, ok := session.Values["oauth_authenticated"].(bool)
	if !ok || !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Return color palette
	colorPalette := []map[string]string{
		{"id": "1", "color": "#a4bdfc", "name": "Lavender"},
		{"id": "2", "color": "#7ae7bf", "name": "Sage"},
		{"id": "3", "color": "#dbadff", "name": "Grape"},
		{"id": "4", "color": "#ff887c", "name": "Flamingo"},
		{"id": "5", "color": "#fbd75b", "name": "Banana"},
		{"id": "6", "color": "#ffb878", "name": "Tangerine"},
		{"id": "7", "color": "#46d6db", "name": "Peacock"},
		{"id": "8", "color": "#e1e1e1", "name": "Graphite"},
		{"id": "9", "color": "#5484ed", "name": "Blueberry"},
		{"id": "10", "color": "#51b749", "name": "Basil"},
		{"id": "11", "color": "#dc2127", "name": "Tomato"},
		{"id": "12", "color": "#eb7c00", "name": "Pumpkin"},
	}

	// 3. Return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(colorPalette)
}
