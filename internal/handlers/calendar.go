package handlers

import (
	"encoding/json"
	"html/template"
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
	events, err := h.calendarService.GetCalendarEvents(r.Context(), token, start, end)
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

// AuthRequired middleware protects calendar routes
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
