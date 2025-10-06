package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"woodhome-webapp/internal/models"
	"woodhome-webapp/internal/services"
)

// CalendarEventsHandler handles calendar event operations
type CalendarEventsHandler struct {
	eventService *services.CalendarEventService
}

// NewCalendarEventsHandler creates a new calendar events handler
func NewCalendarEventsHandler() *CalendarEventsHandler {
	return &CalendarEventsHandler{}
}

// CreateEventHandler handles creating a new calendar event
func (h *CalendarEventsHandler) CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	// Check authentication
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
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var req models.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create event service
	eventService, err := services.NewCalendarEventService(r.Context(), token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to create event service", http.StatusInternalServerError)
		return
	}

	// Create the event
	event, err := eventService.CreateEvent(r.Context(), &req)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	// Return response
	response := models.EventResponse{
		Success: true,
		Message: "Event created successfully",
		Event:   event,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetEventHandler handles retrieving a specific calendar event
func (h *CalendarEventsHandler) GetEventHandler(w http.ResponseWriter, r *http.Request) {
	// Check authentication
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
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Get event ID from URL
	vars := mux.Vars(r)
	eventID := vars["id"]
	if eventID == "" {
		http.Error(w, "Event ID is required", http.StatusBadRequest)
		return
	}

	// Create event service
	eventService, err := services.NewCalendarEventService(r.Context(), token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to create event service", http.StatusInternalServerError)
		return
	}

	// Get the event
	event, err := eventService.GetEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, "Failed to get event", http.StatusInternalServerError)
		return
	}

	// Return response
	response := models.EventResponse{
		Success: true,
		Event:   event,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateEventHandler handles updating an existing calendar event
func (h *CalendarEventsHandler) UpdateEventHandler(w http.ResponseWriter, r *http.Request) {
	// Check authentication
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
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Get event ID from URL
	vars := mux.Vars(r)
	eventID := vars["id"]
	if eventID == "" {
		http.Error(w, "Event ID is required", http.StatusBadRequest)
		return
	}

	// Parse request body
	var req models.UpdateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create event service
	eventService, err := services.NewCalendarEventService(r.Context(), token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to create event service", http.StatusInternalServerError)
		return
	}

	// Update the event
	event, err := eventService.UpdateEvent(r.Context(), eventID, &req)
	if err != nil {
		http.Error(w, "Failed to update event", http.StatusInternalServerError)
		return
	}

	// Return response
	response := models.EventResponse{
		Success: true,
		Message: "Event updated successfully",
		Event:   event,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DeleteEventHandler handles deleting a calendar event
func (h *CalendarEventsHandler) DeleteEventHandler(w http.ResponseWriter, r *http.Request) {
	// Check authentication
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
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Get event ID from URL
	vars := mux.Vars(r)
	eventID := vars["id"]
	if eventID == "" {
		http.Error(w, "Event ID is required", http.StatusBadRequest)
		return
	}

	// Create event service
	eventService, err := services.NewCalendarEventService(r.Context(), token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to create event service", http.StatusInternalServerError)
		return
	}

	// Delete the event
	err = eventService.DeleteEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, "Failed to delete event", http.StatusInternalServerError)
		return
	}

	// Return response
	response := models.EventResponse{
		Success: true,
		Message: "Event deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetEventsForDateHandler handles retrieving events for a specific date
func (h *CalendarEventsHandler) GetEventsForDateHandler(w http.ResponseWriter, r *http.Request) {
	// Check authentication
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
		http.Error(w, "Token not found", http.StatusUnauthorized)
		return
	}

	// Get date from URL
	vars := mux.Vars(r)
	date := vars["date"]
	if date == "" {
		http.Error(w, "Date is required", http.StatusBadRequest)
		return
	}

	// Validate date format
	_, err = time.Parse("2006-01-02", date)
	if err != nil {
		http.Error(w, "Invalid date format. Use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Create event service
	eventService, err := services.NewCalendarEventService(r.Context(), token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to create event service", http.StatusInternalServerError)
		return
	}

	// Get events for the date
	events, err := eventService.GetEventsForDate(r.Context(), date)
	if err != nil {
		http.Error(w, "Failed to get events for date", http.StatusInternalServerError)
		return
	}

	// Return response
	response := models.EventResponse{
		Success: true,
		Events:  events,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
