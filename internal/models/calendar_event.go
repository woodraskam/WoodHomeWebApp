package models

import (
	"time"
)

// CalendarEvent represents a Google Calendar event
type CalendarEvent struct {
	ID          string                 `json:"id"`
	Summary     string                 `json:"summary"`
	Description string                 `json:"description,omitempty"`
	Start       *EventDateTime         `json:"start"`
	End         *EventDateTime         `json:"end"`
	Location    string                 `json:"location,omitempty"`
	Attendees   []*EventAttendee       `json:"attendees,omitempty"`
	Reminders   *EventReminders        `json:"reminders,omitempty"`
	Recurrence  []string               `json:"recurrence,omitempty"`
	AllDay      bool                   `json:"allDay"`
	Created     time.Time              `json:"created,omitempty"`
	Updated     time.Time              `json:"updated,omitempty"`
	Creator     *EventCreator          `json:"creator,omitempty"`
	Organizer   *EventOrganizer        `json:"organizer,omitempty"`
	Status      string                 `json:"status,omitempty"`
	Visibility  string                 `json:"visibility,omitempty"`
	ColorID     string                 `json:"colorId,omitempty"`
	CalendarID  string                 `json:"calendarId,omitempty"`
	ExtendedProperties map[string]interface{} `json:"extendedProperties,omitempty"`
}

// EventDateTime represents the start or end time of an event
type EventDateTime struct {
	DateTime time.Time `json:"dateTime,omitempty"`
	Date     string    `json:"date,omitempty"` // For all-day events
	TimeZone string    `json:"timeZone,omitempty"`
}

// EventAttendee represents an attendee of an event
type EventAttendee struct {
	Email       string `json:"email"`
	DisplayName string `json:"displayName,omitempty"`
	ResponseStatus string `json:"responseStatus,omitempty"`
	Optional    bool   `json:"optional,omitempty"`
}

// EventReminders represents reminder settings for an event
type EventReminders struct {
	UseDefault bool           `json:"useDefault,omitempty"`
	Overrides  []*ReminderOverride `json:"overrides,omitempty"`
}

// ReminderOverride represents a specific reminder override
type ReminderOverride struct {
	Method  string `json:"method"`
	Minutes int    `json:"minutes"`
}

// EventCreator represents the creator of an event
type EventCreator struct {
	Email       string `json:"email,omitempty"`
	DisplayName string `json:"displayName,omitempty"`
	Self        bool   `json:"self,omitempty"`
}

// EventOrganizer represents the organizer of an event
type EventOrganizer struct {
	Email       string `json:"email,omitempty"`
	DisplayName string `json:"displayName,omitempty"`
	Self        bool   `json:"self,omitempty"`
}

// CreateEventRequest represents a request to create a new event
type CreateEventRequest struct {
	Summary     string                 `json:"summary" validate:"required"`
	Description string                 `json:"description,omitempty"`
	Start       *EventDateTime         `json:"start" validate:"required"`
	End         *EventDateTime         `json:"end" validate:"required"`
	Location    string                 `json:"location,omitempty"`
	Attendees   []*EventAttendee       `json:"attendees,omitempty"`
	Reminders   *EventReminders        `json:"reminders,omitempty"`
	Recurrence  []string               `json:"recurrence,omitempty"`
	AllDay      bool                   `json:"allDay,omitempty"`
	ColorID     string                 `json:"colorId,omitempty"`
}

// UpdateEventRequest represents a request to update an existing event
type UpdateEventRequest struct {
	Summary     string                 `json:"summary,omitempty"`
	Description string                 `json:"description,omitempty"`
	Start       *EventDateTime         `json:"start,omitempty"`
	End         *EventDateTime         `json:"end,omitempty"`
	Location    string                 `json:"location,omitempty"`
	Attendees   []*EventAttendee       `json:"attendees,omitempty"`
	Reminders   *EventReminders        `json:"reminders,omitempty"`
	Recurrence  []string               `json:"recurrence,omitempty"`
	AllDay      *bool                  `json:"allDay,omitempty"`
	ColorID     string                 `json:"colorId,omitempty"`
}

// EventResponse represents the response for event operations
type EventResponse struct {
	Success bool           `json:"success"`
	Message string        `json:"message,omitempty"`
	Event   *CalendarEvent `json:"event,omitempty"`
	Events  []*CalendarEvent `json:"events,omitempty"`
}

// EventsForDateRequest represents a request to get events for a specific date
type EventsForDateRequest struct {
	Date string `json:"date" validate:"required"` // Format: YYYY-MM-DD
}

// DeleteEventRequest represents a request to delete an event
type DeleteEventRequest struct {
	EventID string `json:"eventId" validate:"required"`
}
