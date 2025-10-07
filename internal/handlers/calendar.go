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
	"google.golang.org/api/calendar/v3"
)

// CalendarHandler handles HTTP requests for calendar operations
type CalendarHandler struct {
	calendarService      *services.CalendarService
	calendarCacheService *services.CalendarCacheService
}

// NewCalendarHandler creates a new CalendarHandler instance
func NewCalendarHandler(calendarService *services.CalendarService) *CalendarHandler {
	// Create calendar cache service with default configuration
	cacheConfig := services.DefaultCalendarCacheConfig()
	calendarCacheService := services.NewCalendarCacheService(calendarService, cacheConfig)

	return &CalendarHandler{
		calendarService:      calendarService,
		calendarCacheService: calendarCacheService,
	}
}

// RegisterRoutes registers all calendar routes
func (h *CalendarHandler) RegisterRoutes(router *mux.Router) {
	calendarRouter := router.PathPrefix("/api/calendar").Subrouter()

	// Calendar API routes
	calendarRouter.HandleFunc("/events", h.GetEventsHandler).Methods("GET")
	calendarRouter.HandleFunc("/calendars", h.GetCalendarsHandler).Methods("GET")
	calendarRouter.HandleFunc("/colors", h.GetColorsHandler).Methods("GET")

	// Cache management routes
	calendarRouter.HandleFunc("/cache/refresh", h.RefreshCacheHandler).Methods("POST")
	calendarRouter.HandleFunc("/cache/stats", h.GetCacheStatsHandler).Methods("GET")
	calendarRouter.HandleFunc("/cache/clear", h.ClearCacheHandler).Methods("POST")
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

	// Fetch events from Google Calendar (with caching)
	events, err := h.calendarCacheService.GetCalendarEvents(r.Context(), token, start, end)
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

	// 3. Fetch calendars (with caching)
	calendars, err := h.calendarCacheService.GetCalendars(r.Context(), &token)
	if err != nil {
		log.Printf("Failed to fetch calendars: %v", err)
		http.Error(w, "Failed to fetch calendars", http.StatusInternalServerError)
		return
	}

	// 4. Return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calendars)
}

// GetColorsHandler returns the Google Calendar color palette and calendar colors
func (h *CalendarHandler) GetColorsHandler(w http.ResponseWriter, r *http.Request) {
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

	// Get OAuth token
	token, err := getOAuthTokenFromSQLite(userID)
	if err != nil {
		log.Printf("Failed to get token from SQLite: %v", err)
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Create OAuth2 client
	client := oauth2.NewClient(r.Context(), oauth2.StaticTokenSource(token))

	// Create Google Calendar service
	service, err := calendar.New(client)
	if err != nil {
		log.Printf("Failed to create calendar service: %v", err)
		http.Error(w, "Failed to create calendar service", http.StatusInternalServerError)
		return
	}

	// Fetch calendar list from Google Calendar API
	calendarList, err := service.CalendarList.List().Do()
	if err != nil {
		log.Printf("Failed to fetch calendar list: %v", err)
		http.Error(w, "Failed to fetch calendar list", http.StatusInternalServerError)
		return
	}

	// Extract color information
	colors := make(map[string]map[string]string)
	for _, calendar := range calendarList.Items {
		colors[calendar.Id] = map[string]string{
			"backgroundColor": calendar.BackgroundColor,
			"foregroundColor": calendar.ForegroundColor,
			"summary":         calendar.Summary,
		}
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(colors)
}

// RefreshCacheHandler manually refreshes the cache for the current user
func (h *CalendarHandler) RefreshCacheHandler(w http.ResponseWriter, r *http.Request) {
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

	// Invalidate all cache for this user
	h.calendarCacheService.InvalidateAllCache(token)

	// Return success response
	response := map[string]string{
		"status":  "success",
		"message": "Cache refreshed successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetCacheStatsHandler returns cache performance statistics
func (h *CalendarHandler) GetCacheStatsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check authentication
	session, _ := GetSessionStore().Get(r, "auth-session")
	authenticated, ok := session.Values["oauth_authenticated"].(bool)
	if !ok || !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get cache statistics
	stats := h.calendarCacheService.GetCacheStats()
	metadata := h.calendarCacheService.GetCacheMetadata()
	config := h.calendarCacheService.GetConfig()

	// Create response with cache information
	response := map[string]interface{}{
		"stats":    stats,
		"metadata": metadata,
		"config":   config,
		"healthy":  h.calendarCacheService.IsCacheHealthy(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ClearCacheHandler clears all cache entries
func (h *CalendarHandler) ClearCacheHandler(w http.ResponseWriter, r *http.Request) {
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

	// Clear all cache for this user
	h.calendarCacheService.InvalidateAllCache(token)

	// Return success response
	response := map[string]string{
		"status":  "success",
		"message": "Cache cleared successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
