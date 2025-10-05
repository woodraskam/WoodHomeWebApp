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
	ID            string `json:"id"`
	Title         string `json:"title"`
	Start         string `json:"start"`
	End           string `json:"end"`
	Description   string `json:"description,omitempty"`
	Color         string `json:"color,omitempty"`
	AllDay        bool   `json:"allDay,omitempty"`
	CalendarID    string `json:"calendarId,omitempty"`
	CalendarColor string `json:"calendarColor,omitempty"`
}

// CalendarInfo represents a calendar with its color information
type CalendarInfo struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// CalendarColorPalette represents Google Calendar color palette
type CalendarColorPalette struct {
	ID         string `json:"id"`
	Color      string `json:"color"`
	Background string `json:"background"`
	Foreground string `json:"foreground"`
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

// GetCalendars fetches the user's calendar list with color information
func (s *CalendarService) GetCalendars(ctx context.Context, token *oauth2.Token) ([]CalendarInfo, error) {
	// Refresh token if expired
	if token.Expiry.Before(time.Now()) {
		tokenSource := s.oauthConfig.TokenSource(ctx, token)
		newToken, err := tokenSource.Token()
		if err != nil {
			return nil, err
		}
		*token = *newToken // Update token in-place
	}

	// Create authenticated HTTP client
	client := s.oauthConfig.Client(ctx, token)

	// Create Calendar service
	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	// Get list of all calendars
	calendarList, err := srv.CalendarList.List().Do()
	if err != nil {
		return nil, err
	}

	// Convert to our CalendarInfo format
	var calendars []CalendarInfo
	for _, cal := range calendarList.Items {
		calendarInfo := CalendarInfo{
			ID:    cal.Id,
			Name:  cal.Summary,
			Color: s.getCalendarColor(cal.ColorId),
		}
		calendars = append(calendars, calendarInfo)
	}

	return calendars, nil
}

// getCalendarColor maps Google Calendar color ID to hex color
func (s *CalendarService) getCalendarColor(colorID string) string {
	// Google Calendar color palette mapping
	colorMap := map[string]string{
		"1":   "#a4bdfc", // Lavender
		"2":   "#7ae7bf", // Sage
		"3":   "#dbadff", // Grape
		"4":   "#ff887c", // Flamingo
		"5":   "#fbd75b", // Banana
		"6":   "#ffb878", // Tangerine
		"7":   "#46d6db", // Peacock
		"8":   "#e1e1e1", // Graphite
		"9":   "#5484ed", // Blueberry
		"10":  "#51b749", // Basil
		"11":  "#dc2127", // Tomato
		"12":  "#eb7c00", // Pumpkin
		"13":  "#b7356c", // Cherry
		"14":  "#f7c41f", // Honey
		"15":  "#92e1c0", // Sage
		"16":  "#f09300", // Orange
		"17":  "#e67c73", // Red
		"18":  "#f06292", // Pink
		"19":  "#ba68c8", // Purple
		"20":  "#9575cd", // Deep Purple
		"21":  "#7986cb", // Indigo
		"22":  "#64b5f6", // Blue
		"23":  "#4fc3f7", // Light Blue
		"24":  "#4dd0e1", // Cyan
		"25":  "#4db6ac", // Teal
		"26":  "#81c784", // Green
		"27":  "#aed581", // Light Green
		"28":  "#dce775", // Lime
		"29":  "#fff176", // Yellow
		"30":  "#ffd54f", // Amber
		"31":  "#ffb74d", // Orange
		"32":  "#ff8a65", // Deep Orange
		"33":  "#a1887f", // Brown
		"34":  "#90a4ae", // Blue Grey
		"35":  "#78909c", // Blue Grey
		"36":  "#607d8b", // Blue Grey
		"37":  "#546e7a", // Blue Grey
		"38":  "#455a64", // Blue Grey
		"39":  "#37474f", // Blue Grey
		"40":  "#263238", // Blue Grey
		"41":  "#795548", // Brown
		"42":  "#8d6e63", // Brown
		"43":  "#a1887f", // Brown
		"44":  "#bcaaa4", // Brown
		"45":  "#d7ccc8", // Brown
		"46":  "#efebe9", // Brown
		"47":  "#f3e5f5", // Purple
		"48":  "#e1bee7", // Purple
		"49":  "#ce93d8", // Purple
		"50":  "#ba68c8", // Purple
		"51":  "#ab47bc", // Purple
		"52":  "#9c27b0", // Purple
		"53":  "#8e24aa", // Purple
		"54":  "#7b1fa2", // Purple
		"55":  "#6a1b9a", // Purple
		"56":  "#4a148c", // Purple
		"57":  "#e8eaf6", // Indigo
		"58":  "#c5cae9", // Indigo
		"59":  "#9fa8da", // Indigo
		"60":  "#7986cb", // Indigo
		"61":  "#5c6bc0", // Indigo
		"62":  "#3f51b5", // Indigo
		"63":  "#3949ab", // Indigo
		"64":  "#303f9f", // Indigo
		"65":  "#283593", // Indigo
		"66":  "#1a237e", // Indigo
		"67":  "#e3f2fd", // Blue
		"68":  "#bbdefb", // Blue
		"69":  "#90caf9", // Blue
		"70":  "#64b5f6", // Blue
		"71":  "#42a5f5", // Blue
		"72":  "#2196f3", // Blue
		"73":  "#1e88e5", // Blue
		"74":  "#1976d2", // Blue
		"75":  "#1565c0", // Blue
		"76":  "#0d47a1", // Blue
		"77":  "#e0f2f1", // Teal
		"78":  "#b2dfdb", // Teal
		"79":  "#80cbc4", // Teal
		"80":  "#4db6ac", // Teal
		"81":  "#26a69a", // Teal
		"82":  "#009688", // Teal
		"83":  "#00897b", // Teal
		"84":  "#00796b", // Teal
		"85":  "#00695c", // Teal
		"86":  "#004d40", // Teal
		"87":  "#e8f5e8", // Green
		"88":  "#c8e6c9", // Green
		"89":  "#a5d6a7", // Green
		"90":  "#81c784", // Green
		"91":  "#66bb6a", // Green
		"92":  "#4caf50", // Green
		"93":  "#43a047", // Green
		"94":  "#388e3c", // Green
		"95":  "#2e7d32", // Green
		"96":  "#1b5e20", // Green
		"97":  "#f1f8e9", // Light Green
		"98":  "#dcedc8", // Light Green
		"99":  "#c5e1a5", // Light Green
		"100": "#aed581", // Light Green
		"101": "#9ccc65", // Light Green
		"102": "#8bc34a", // Light Green
		"103": "#7cb342", // Light Green
		"104": "#689f38", // Light Green
		"105": "#558b2f", // Light Green
		"106": "#33691e", // Light Green
		"107": "#f9fbe7", // Lime
		"108": "#f0f4c3", // Lime
		"109": "#e6ee9c", // Lime
		"110": "#dce775", // Lime
		"111": "#d4e157", // Lime
		"112": "#cddc39", // Lime
		"113": "#c0ca33", // Lime
		"114": "#afb42b", // Lime
		"115": "#9e9d24", // Lime
		"116": "#827717", // Lime
		"117": "#fffde7", // Yellow
		"118": "#fff9c4", // Yellow
		"119": "#fff59d", // Yellow
		"120": "#fff176", // Yellow
		"121": "#ffee58", // Yellow
		"122": "#ffeb3b", // Yellow
		"123": "#fdd835", // Yellow
		"124": "#fbc02d", // Yellow
		"125": "#f9a825", // Yellow
		"126": "#f57f17", // Yellow
		"127": "#fff8e1", // Amber
		"128": "#ffecb3", // Amber
		"129": "#ffe082", // Amber
		"130": "#ffd54f", // Amber
		"131": "#ffca28", // Amber
		"132": "#ffc107", // Amber
		"133": "#ffb300", // Amber
		"134": "#ffa000", // Amber
		"135": "#ff8f00", // Amber
		"136": "#ff6f00", // Amber
		"137": "#fff3e0", // Orange
		"138": "#ffe0b2", // Orange
		"139": "#ffcc80", // Orange
		"140": "#ffb74d", // Orange
		"141": "#ffa726", // Orange
		"142": "#ff9800", // Orange
		"143": "#fb8c00", // Orange
		"144": "#f57c00", // Orange
		"145": "#ef6c00", // Orange
		"146": "#e65100", // Orange
		"147": "#fbe9e7", // Deep Orange
		"148": "#ffccbc", // Deep Orange
		"149": "#ffab91", // Deep Orange
		"150": "#ff8a65", // Deep Orange
		"151": "#ff7043", // Deep Orange
		"152": "#ff5722", // Deep Orange
		"153": "#f4511e", // Deep Orange
		"154": "#e64a19", // Deep Orange
		"155": "#d84315", // Deep Orange
		"156": "#bf360c", // Deep Orange
		"157": "#efebe9", // Brown
		"158": "#d7ccc8", // Brown
		"159": "#bcaaa4", // Brown
		"160": "#a1887f", // Brown
		"161": "#8d6e63", // Brown
		"162": "#795548", // Brown
		"163": "#6d4c41", // Brown
		"164": "#5d4037", // Brown
		"165": "#4e342e", // Brown
		"166": "#3e2723", // Brown
		"167": "#fafafa", // Grey
		"168": "#f5f5f5", // Grey
		"169": "#eeeeee", // Grey
		"170": "#e0e0e0", // Grey
		"171": "#bdbdbd", // Grey
		"172": "#9e9e9e", // Grey
		"173": "#757575", // Grey
		"174": "#616161", // Grey
		"175": "#424242", // Grey
		"176": "#212121", // Grey
		"177": "#eceff1", // Blue Grey
		"178": "#cfd8dc", // Blue Grey
		"179": "#b0bec5", // Blue Grey
		"180": "#90a4ae", // Blue Grey
		"181": "#78909c", // Blue Grey
		"182": "#607d8b", // Blue Grey
		"183": "#546e7a", // Blue Grey
		"184": "#455a64", // Blue Grey
		"185": "#37474f", // Blue Grey
		"186": "#263238", // Blue Grey
	}

	if color, exists := colorMap[colorID]; exists {
		return color
	}

	// Default color if not found
	return "#4285f4" // Google Blue
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
			event.ExtendedProperties.Private["calendarColor"] = s.getCalendarColor(cal.ColorId)
			event.ExtendedProperties.Private["calendarId"] = cal.Id
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

		// Add calendar information
		if item.ExtendedProperties != nil && item.ExtendedProperties.Private != nil {
			if calendarName, exists := item.ExtendedProperties.Private["calendarName"]; exists && calendarName != "" {
				event.Title = "[" + calendarName + "] " + event.Title
			}
			if calendarId, exists := item.ExtendedProperties.Private["calendarId"]; exists {
				event.CalendarID = calendarId
			}
			if calendarColor, exists := item.ExtendedProperties.Private["calendarColor"]; exists {
				event.CalendarColor = calendarColor
				// Use calendar color as the primary color if no event-specific color
				if event.Color == "" {
					event.Color = calendarColor
				}
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
