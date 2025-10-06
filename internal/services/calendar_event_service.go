package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"golang.org/x/oauth2"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
	"woodhome-webapp/internal/models"
)

// CalendarEventService handles calendar event operations
type CalendarEventService struct {
	service *calendar.Service
}

// NewCalendarEventService creates a new calendar event service
func NewCalendarEventService(ctx context.Context, token string) (*CalendarEventService, error) {
	// Create OAuth2 config and token source
	config := NewGoogleOAuthConfig()
	tokenSource := config.TokenSource(ctx, &oauth2.Token{
		AccessToken: token,
	})

	// Create calendar service
	service, err := calendar.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service: %v", err)
	}

	return &CalendarEventService{
		service: service,
	}, nil
}

// CreateEvent creates a new calendar event
func (s *CalendarEventService) CreateEvent(ctx context.Context, req *models.CreateEventRequest) (*models.CalendarEvent, error) {
	// Convert request to Google Calendar event
	event := &calendar.Event{
		Summary:     req.Summary,
		Description: req.Description,
		Location:    req.Location,
		ColorId:     req.ColorID,
	}

	// Set start time
	if req.AllDay {
		event.Start = &calendar.EventDateTime{
			Date:     req.Start.Date,
			TimeZone: req.Start.TimeZone,
		}
		event.End = &calendar.EventDateTime{
			Date:     req.End.Date,
			TimeZone: req.End.TimeZone,
		}
	} else {
		event.Start = &calendar.EventDateTime{
			DateTime: req.Start.DateTime.Format(time.RFC3339),
			TimeZone: req.Start.TimeZone,
		}
		event.End = &calendar.EventDateTime{
			DateTime: req.End.DateTime.Format(time.RFC3339),
			TimeZone: req.End.TimeZone,
		}
	}

	// Set attendees
	if len(req.Attendees) > 0 {
		event.Attendees = make([]*calendar.EventAttendee, len(req.Attendees))
		for i, attendee := range req.Attendees {
			event.Attendees[i] = &calendar.EventAttendee{
				Email:       attendee.Email,
				DisplayName: attendee.DisplayName,
				Optional:    attendee.Optional,
			}
		}
	}

	// Set reminders
	if req.Reminders != nil {
		event.Reminders = &calendar.EventReminders{
			UseDefault: req.Reminders.UseDefault,
		}
		if len(req.Reminders.Overrides) > 0 {
			event.Reminders.Overrides = make([]*calendar.EventReminder, len(req.Reminders.Overrides))
			for i, override := range req.Reminders.Overrides {
				event.Reminders.Overrides[i] = &calendar.EventReminder{
					Method:  override.Method,
					Minutes: int64(override.Minutes),
				}
			}
		}
	}

	// Set recurrence
	if len(req.Recurrence) > 0 {
		event.Recurrence = req.Recurrence
	}

	// Create the event
	createdEvent, err := s.service.Events.Insert("primary", event).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %v", err)
	}

	// Convert response to our model
	return s.convertToCalendarEvent(createdEvent), nil
}

// GetEvent retrieves a specific calendar event
func (s *CalendarEventService) GetEvent(ctx context.Context, eventID string) (*models.CalendarEvent, error) {
	event, err := s.service.Events.Get("primary", eventID).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get event: %v", err)
	}

	return s.convertToCalendarEvent(event), nil
}

// UpdateEvent updates an existing calendar event
func (s *CalendarEventService) UpdateEvent(ctx context.Context, eventID string, req *models.UpdateEventRequest) (*models.CalendarEvent, error) {
	// Get existing event first
	existingEvent, err := s.service.Events.Get("primary", eventID).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get existing event: %v", err)
	}

	// Update fields if provided
	if req.Summary != "" {
		existingEvent.Summary = req.Summary
	}
	if req.Description != "" {
		existingEvent.Description = req.Description
	}
	if req.Location != "" {
		existingEvent.Location = req.Location
	}
	if req.ColorID != "" {
		existingEvent.ColorId = req.ColorID
	}

	// Update start/end times if provided
	if req.Start != nil {
		if req.AllDay != nil && *req.AllDay {
			existingEvent.Start = &calendar.EventDateTime{
				Date:     req.Start.Date,
				TimeZone: req.Start.TimeZone,
			}
		} else {
			existingEvent.Start = &calendar.EventDateTime{
				DateTime: req.Start.DateTime.Format(time.RFC3339),
				TimeZone: req.Start.TimeZone,
			}
		}
	}

	if req.End != nil {
		if req.AllDay != nil && *req.AllDay {
			existingEvent.End = &calendar.EventDateTime{
				Date:     req.End.Date,
				TimeZone: req.End.TimeZone,
			}
		} else {
			existingEvent.End = &calendar.EventDateTime{
				DateTime: req.End.DateTime.Format(time.RFC3339),
				TimeZone: req.End.TimeZone,
			}
		}
	}

	// Update attendees if provided
	if req.Attendees != nil {
		existingEvent.Attendees = make([]*calendar.EventAttendee, len(req.Attendees))
		for i, attendee := range req.Attendees {
			existingEvent.Attendees[i] = &calendar.EventAttendee{
				Email:       attendee.Email,
				DisplayName: attendee.DisplayName,
				Optional:    attendee.Optional,
			}
		}
	}

	// Update reminders if provided
	if req.Reminders != nil {
		existingEvent.Reminders = &calendar.EventReminders{
			UseDefault: req.Reminders.UseDefault,
		}
		if len(req.Reminders.Overrides) > 0 {
			existingEvent.Reminders.Overrides = make([]*calendar.EventReminder, len(req.Reminders.Overrides))
			for i, override := range req.Reminders.Overrides {
				existingEvent.Reminders.Overrides[i] = &calendar.EventReminder{
					Method:  override.Method,
					Minutes: int64(override.Minutes),
				}
			}
		}
	}

	// Update recurrence if provided
	if req.Recurrence != nil {
		existingEvent.Recurrence = req.Recurrence
	}

	// Update the event
	updatedEvent, err := s.service.Events.Update("primary", eventID, existingEvent).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to update event: %v", err)
	}

	return s.convertToCalendarEvent(updatedEvent), nil
}

// DeleteEvent deletes a calendar event
func (s *CalendarEventService) DeleteEvent(ctx context.Context, eventID string) error {
	err := s.service.Events.Delete("primary", eventID).Do()
	if err != nil {
		return fmt.Errorf("failed to delete event: %v", err)
	}

	return nil
}

// GetEventsForDate retrieves events for a specific date
func (s *CalendarEventService) GetEventsForDate(ctx context.Context, date string) ([]*models.CalendarEvent, error) {
	// Parse the date
	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format: %v", err)
	}

	// Set time range for the day
	startTime := parsedDate.Format(time.RFC3339)
	endTime := parsedDate.Add(24 * time.Hour).Format(time.RFC3339)

	// Get events for the date
	events, err := s.service.Events.List("primary").
		TimeMin(startTime).
		TimeMax(endTime).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		return nil, fmt.Errorf("failed to get events for date: %v", err)
	}

	// Convert to our model
	result := make([]*models.CalendarEvent, len(events.Items))
	for i, event := range events.Items {
		result[i] = s.convertToCalendarEvent(event)
	}

	return result, nil
}

// convertToCalendarEvent converts a Google Calendar event to our model
func (s *CalendarEventService) convertToCalendarEvent(event *calendar.Event) *models.CalendarEvent {
	result := &models.CalendarEvent{
		ID:          event.Id,
		Summary:     event.Summary,
		Description: event.Description,
		Location:    event.Location,
		Status:      event.Status,
		Visibility:  event.Visibility,
		ColorID:     event.ColorId,
		Created:     parseTime(event.Created),
		Updated:     parseTime(event.Updated),
	}

	// Convert start time
	if event.Start != nil {
		result.Start = &models.EventDateTime{
			DateTime: parseTime(event.Start.DateTime),
			Date:     event.Start.Date,
			TimeZone: event.Start.TimeZone,
		}
		// Determine if it's an all-day event
		result.AllDay = event.Start.Date != ""
	}

	// Convert end time
	if event.End != nil {
		result.End = &models.EventDateTime{
			DateTime: parseTime(event.End.DateTime),
			Date:     event.End.Date,
			TimeZone: event.End.TimeZone,
		}
	}

	// Convert attendees
	if len(event.Attendees) > 0 {
		result.Attendees = make([]*models.EventAttendee, len(event.Attendees))
		for i, attendee := range event.Attendees {
			result.Attendees[i] = &models.EventAttendee{
				Email:         attendee.Email,
				DisplayName:   attendee.DisplayName,
				ResponseStatus: attendee.ResponseStatus,
				Optional:      attendee.Optional,
			}
		}
	}

	// Convert reminders
	if event.Reminders != nil {
		result.Reminders = &models.EventReminders{
			UseDefault: event.Reminders.UseDefault,
		}
		if len(event.Reminders.Overrides) > 0 {
			result.Reminders.Overrides = make([]*models.ReminderOverride, len(event.Reminders.Overrides))
			for i, override := range event.Reminders.Overrides {
				result.Reminders.Overrides[i] = &models.ReminderOverride{
					Method:  override.Method,
					Minutes: int(override.Minutes),
				}
			}
		}
	}

	// Convert creator
	if event.Creator != nil {
		result.Creator = &models.EventCreator{
			Email:       event.Creator.Email,
			DisplayName: event.Creator.DisplayName,
			Self:        event.Creator.Self,
		}
	}

	// Convert organizer
	if event.Organizer != nil {
		result.Organizer = &models.EventOrganizer{
			Email:       event.Organizer.Email,
			DisplayName: event.Organizer.DisplayName,
			Self:        event.Organizer.Self,
		}
	}

	// Copy recurrence
	if len(event.Recurrence) > 0 {
		result.Recurrence = event.Recurrence
	}

	return result
}

// parseTime parses a time string and returns a time.Time
func parseTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Time{}
	}
	
	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		log.Printf("Failed to parse time %s: %v", timeStr, err)
		return time.Time{}
	}
	
	return t
}
