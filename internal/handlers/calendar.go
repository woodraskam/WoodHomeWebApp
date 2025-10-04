package handlers

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"time"

	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
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
