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
	ID          string `json:"id"`
	Title       string `json:"title"`
	Start       string `json:"start"`
	End         string `json:"end"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty"`
	AllDay      bool   `json:"allDay,omitempty"`
}

// CalendarService handles Google Calendar operations
type CalendarService struct {
	oauthConfig *oauth2.Config
}

// NewCalendarService creates a new CalendarService instance
func NewCalendarService(oauthConfig *oauth2.Config) *CalendarService {
	return &CalendarService{
		oauthConfig: oauthConfig,
	}
}

// GetCalendarEvents fetches events from Google Calendar
func (s *CalendarService) GetCalendarEvents(ctx context.Context, token *oauth2.Token, start, end time.Time) ([]CalendarEvent, error) {
	// Refresh token if expired
	if token.Expiry.Before(time.Now()) {
		tokenSource := s.oauthConfig.TokenSource(ctx, token)
		newToken, err := tokenSource.Token()
		if err != nil {
			return nil, err
		}
		*token = *newToken // Update token in-place
		// Note: Token refresh is handled by the handler layer
	}

	// Create authenticated HTTP client
	client := s.oauthConfig.Client(ctx, token)

	// Create Calendar service
	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	// First, get list of all calendars
	calendarList, err := srv.CalendarList.List().Do()
	if err != nil {
		return nil, err
	}

	// Fetch events from all calendars
	var allEvents []*calendar.Event
	for _, cal := range calendarList.Items {
		// Skip calendars that are not selected or are hidden
		if cal.Selected == false || cal.Hidden == true {
			continue
		}

		events, err := srv.Events.List(cal.Id).
			TimeMin(start.Format(time.RFC3339)).
			TimeMax(end.Format(time.RFC3339)).
			SingleEvents(true).
			OrderBy("startTime").
			MaxResults(250). // Limit per calendar to avoid hitting API limits
			Do()

		if err != nil {
			// Log error but continue with other calendars
			continue
		}

		// Add calendar info to each event
		for _, event := range events.Items {
			// Add calendar name and color to event
			if event.ExtendedProperties == nil {
				event.ExtendedProperties = &calendar.EventExtendedProperties{}
			}
			if event.ExtendedProperties.Private == nil {
				event.ExtendedProperties.Private = make(map[string]string)
			}
			event.ExtendedProperties.Private["calendarName"] = cal.Summary
			event.ExtendedProperties.Private["calendarColor"] = cal.BackgroundColor
			allEvents = append(allEvents, event)
		}
	}

	// Transform to simplified format
	var calEvents []CalendarEvent
	for _, item := range allEvents {
		event := CalendarEvent{
			ID:          item.Id,
			Title:       item.Summary,
			Description: item.Description,
			Color:       getEventColor(item), // Custom function
		}

		// Add calendar name to title if available
		if item.ExtendedProperties != nil && item.ExtendedProperties.Private != nil {
			if calendarName, exists := item.ExtendedProperties.Private["calendarName"]; exists && calendarName != "" {
				event.Title = "[" + calendarName + "] " + event.Title
			}
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
	return "#3788d8" // Default blue
}
