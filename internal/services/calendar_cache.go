package services

import (
	"context"
	"fmt"
	"time"

	"woodhome-webapp/internal/models"

	"golang.org/x/oauth2"
)

// CalendarCacheService wraps the calendar service with caching functionality
type CalendarCacheService struct {
	calendarService *CalendarService
	cacheService    *CacheService
	config          CalendarCacheConfig
}

// CalendarCacheConfig holds configuration for calendar caching
type CalendarCacheConfig struct {
	DefaultTTL        time.Duration `json:"defaultTTL"`
	CalendarsTTL      time.Duration `json:"calendarsTTL"`
	EventsTTL         time.Duration `json:"eventsTTL"`
	EnableCache       bool          `json:"enableCache"`
	CacheKeyPrefix    string        `json:"cacheKeyPrefix"`
	MaxCacheSize      int64         `json:"maxCacheSize"`
	MaxCacheItems     int64         `json:"maxCacheItems"`
}

// DefaultCalendarCacheConfig returns default configuration for calendar caching
func DefaultCalendarCacheConfig() CalendarCacheConfig {
	return CalendarCacheConfig{
		DefaultTTL:     15 * time.Minute,
		CalendarsTTL:   30 * time.Minute, // Calendars change less frequently
		EventsTTL:      15 * time.Minute,  // Events change more frequently
		EnableCache:    true,
		CacheKeyPrefix: "calendar",
		MaxCacheSize:   50 * 1024 * 1024, // 50MB
		MaxCacheItems:  1000,
	}
}

// NewCalendarCacheService creates a new calendar cache service
func NewCalendarCacheService(calendarService *CalendarService, config CalendarCacheConfig) *CalendarCacheService {
	// Create cache service configuration
	cacheConfig := models.CacheConfig{
		DefaultTTL:     config.DefaultTTL,
		MaxSize:        config.MaxCacheSize,
		MaxItems:       config.MaxCacheItems,
		CleanupInterval: 5 * time.Minute,
		EnableMetrics:  true,
	}

	cacheService := NewCacheService(cacheConfig)

	return &CalendarCacheService{
		calendarService: calendarService,
		cacheService:    cacheService,
		config:          config,
	}
}

// GetCalendars fetches calendars with caching
func (ccs *CalendarCacheService) GetCalendars(ctx context.Context, token *oauth2.Token) ([]CalendarInfo, error) {
	if !ccs.config.EnableCache {
		return ccs.calendarService.GetCalendars(ctx, token)
	}

	// Create cache key based on user token
	cacheKey := ccs.createCalendarsCacheKey(token)

	// Try to get from cache
	if cached, found := ccs.cacheService.Get(cacheKey); found {
		if calendars, ok := cached.([]CalendarInfo); ok {
			return calendars, nil
		}
	}

	// Cache miss - fetch from API
	calendars, err := ccs.calendarService.GetCalendars(ctx, token)
	if err != nil {
		return nil, err
	}

	// Store in cache
	ccs.cacheService.Set(cacheKey, calendars, ccs.config.CalendarsTTL)

	return calendars, nil
}

// GetCalendarEvents fetches calendar events with caching
func (ccs *CalendarCacheService) GetCalendarEvents(ctx context.Context, token *oauth2.Token, start, end time.Time) ([]CalendarEvent, error) {
	if !ccs.config.EnableCache {
		return ccs.calendarService.GetCalendarEvents(ctx, token, start, end)
	}

	// First, try to get from cache with the specific key
	cacheKey := ccs.createEventsCacheKey(token, start, end)
	if cached, found := ccs.cacheService.Get(cacheKey); found {
		if events, ok := cached.([]CalendarEvent); ok {
			// Filter events to the requested time range
			filteredEvents := ccs.filterEventsByTimeRange(events, start, end)
			return filteredEvents, nil
		}
	}

	// Try to find overlapping cached data
	if overlappingEvents := ccs.findOverlappingCachedEvents(token, start, end); len(overlappingEvents) > 0 {
		// We have some cached data, filter it and return
		filteredEvents := ccs.filterEventsByTimeRange(overlappingEvents, start, end)
		if len(filteredEvents) > 0 {
			// Store the filtered results in cache for future use
			ccs.cacheService.Set(cacheKey, filteredEvents, ccs.config.EventsTTL)
			return filteredEvents, nil
		}
	}

	// Cache miss - fetch from API
	events, err := ccs.calendarService.GetCalendarEvents(ctx, token, start, end)
	if err != nil {
		return nil, err
	}

	// Store in cache
	ccs.cacheService.Set(cacheKey, events, ccs.config.EventsTTL)

	return events, nil
}

// InvalidateCalendarsCache invalidates the calendars cache for a user
func (ccs *CalendarCacheService) InvalidateCalendarsCache(token *oauth2.Token) {
	if !ccs.config.EnableCache {
		return
	}

	cacheKey := ccs.createCalendarsCacheKey(token)
	ccs.cacheService.Delete(cacheKey)
}

// InvalidateEventsCache invalidates the events cache for a user and time range
func (ccs *CalendarCacheService) InvalidateEventsCache(token *oauth2.Token, start, end time.Time) {
	if !ccs.config.EnableCache {
		return
	}

	cacheKey := ccs.createEventsCacheKey(token, start, end)
	ccs.cacheService.Delete(cacheKey)
}

// InvalidateAllCache invalidates all cache entries for a user
func (ccs *CalendarCacheService) InvalidateAllCache(token *oauth2.Token) {
	if !ccs.config.EnableCache {
		return
	}

	// This is a simplified approach - in a production system, you might want
	// to track user-specific cache keys for more efficient invalidation
	ccs.cacheService.Clear()
}

// GetCacheStats returns cache performance statistics
func (ccs *CalendarCacheService) GetCacheStats() models.CacheStats {
	return ccs.cacheService.GetStats()
}

// GetCacheMetadata returns cache metadata
func (ccs *CalendarCacheService) GetCacheMetadata() models.CacheMetadata {
	return ccs.cacheService.GetMetadata()
}

// IsCacheHealthy checks if the cache is healthy
func (ccs *CalendarCacheService) IsCacheHealthy() bool {
	return ccs.cacheService.IsHealthy()
}

// createCalendarsCacheKey creates a cache key for calendars
func (ccs *CalendarCacheService) createCalendarsCacheKey(token *oauth2.Token) models.CacheKey {
	// Create a hash of the token for the cache key
	tokenHash := ccs.hashToken(token)
	key := fmt.Sprintf("%s:calendars:%s", ccs.config.CacheKeyPrefix, tokenHash)
	return models.NewCacheKey("", key)
}

// createEventsCacheKey creates a cache key for events
func (ccs *CalendarCacheService) createEventsCacheKey(token *oauth2.Token, start, end time.Time) models.CacheKey {
	// Create a hash of the token and time range for the cache key
	tokenHash := ccs.hashToken(token)
	
	// Create a broader time range for better cache hit rates
	// Round to the nearest month for monthly views
	startMonth := start.Format("2006-01")
	endMonth := end.Format("2006-01")
	
	// If the range spans multiple months, use a broader key
	if startMonth == endMonth {
		// Same month - use month-based key
		timeRange := startMonth
		key := fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, timeRange)
		return models.NewCacheKey("", key)
	} else {
		// Multiple months - use a broader range
		timeRange := fmt.Sprintf("%s_to_%s", startMonth, endMonth)
		key := fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, timeRange)
		return models.NewCacheKey("", key)
	}
}

// filterEventsByTimeRange filters events to the requested time range
func (ccs *CalendarCacheService) filterEventsByTimeRange(events []CalendarEvent, start, end time.Time) []CalendarEvent {
	var filteredEvents []CalendarEvent
	
	for _, event := range events {
		// Parse event start time
		eventStart, err := time.Parse(time.RFC3339, event.Start)
		if err != nil {
			// Try parsing as date only (all-day events)
			eventStart, err = time.Parse("2006-01-02", event.Start)
			if err != nil {
				continue // Skip events with invalid dates
			}
		}
		
		// Check if event is within the requested time range
		if eventStart.After(start) && eventStart.Before(end) {
			filteredEvents = append(filteredEvents, event)
		}
	}
	
	return filteredEvents
}

// findOverlappingCachedEvents looks for cached events that might overlap with the requested time range
func (ccs *CalendarCacheService) findOverlappingCachedEvents(token *oauth2.Token, start, end time.Time) []CalendarEvent {
	tokenHash := ccs.hashToken(token)
	
	// Try to get events from adjacent months
	// This is a simplified approach - check a few common cache keys
	possibleKeys := []string{
		fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, start.AddDate(0, -1, 0).Format("2006-01")),
		fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, start.AddDate(0, 1, 0).Format("2006-01")),
		fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, start.AddDate(0, 2, 0).Format("2006-01")),
	}
	
	for _, key := range possibleKeys {
		if cached, found := ccs.cacheService.Get(models.NewCacheKey("", key)); found {
			if events, ok := cached.([]CalendarEvent); ok {
				// Check if any events overlap with the requested time range
				overlappingEvents := ccs.findOverlappingEvents(events, start, end)
				if len(overlappingEvents) > 0 {
					return overlappingEvents
				}
			}
		}
	}
	
	return nil
}

// isEventsCacheKey checks if a cache key is for events
func (ccs *CalendarCacheService) isEventsCacheKey(key, tokenHash string) bool {
	expectedPrefix := fmt.Sprintf("%s:events:%s:", ccs.config.CacheKeyPrefix, tokenHash)
	return len(key) > len(expectedPrefix) && key[:len(expectedPrefix)] == expectedPrefix
}

// findOverlappingEvents finds events that overlap with the requested time range
func (ccs *CalendarCacheService) findOverlappingEvents(events []CalendarEvent, start, end time.Time) []CalendarEvent {
	var overlappingEvents []CalendarEvent
	
	for _, event := range events {
		// Parse event start time
		eventStart, err := time.Parse(time.RFC3339, event.Start)
		if err != nil {
			// Try parsing as date only (all-day events)
			eventStart, err = time.Parse("2006-01-02", event.Start)
			if err != nil {
				continue // Skip events with invalid dates
			}
		}
		
		// Check if event overlaps with the requested time range
		// Event overlaps if it starts before the end and ends after the start
		if eventStart.Before(end) {
			// For simplicity, we'll consider events that start before the end time
			// In a more sophisticated implementation, you'd also check the event end time
			overlappingEvents = append(overlappingEvents, event)
		}
	}
	
	return overlappingEvents
}

// hashToken creates a simple hash of the token for cache key generation
func (ccs *CalendarCacheService) hashToken(token *oauth2.Token) string {
	// Create a simple hash based on token properties
	// In production, you might want to use a more secure hashing method
	tokenData := fmt.Sprintf("%s_%s_%d", token.AccessToken[:8], token.TokenType, token.Expiry.Unix())
	return fmt.Sprintf("%x", len(tokenData))
}

// UpdateConfig updates the cache configuration
func (ccs *CalendarCacheService) UpdateConfig(newConfig CalendarCacheConfig) {
	ccs.config = newConfig
	
	// Update underlying cache service config
	cacheConfig := models.CacheConfig{
		DefaultTTL:     newConfig.DefaultTTL,
		MaxSize:        newConfig.MaxCacheSize,
		MaxItems:       newConfig.MaxCacheItems,
		CleanupInterval: 5 * time.Minute,
		EnableMetrics:  true,
	}
	
	ccs.cacheService.UpdateConfig(cacheConfig)
}

// GetConfig returns the current cache configuration
func (ccs *CalendarCacheService) GetConfig() CalendarCacheConfig {
	return ccs.config
}

// EnableCache enables or disables caching
func (ccs *CalendarCacheService) EnableCache(enable bool) {
	ccs.config.EnableCache = enable
}

// CleanupCache performs cache cleanup
func (ccs *CalendarCacheService) CleanupCache() {
	ccs.cacheService.Cleanup()
}

// GetCacheSize returns the current cache size
func (ccs *CalendarCacheService) GetCacheSize() int64 {
	return ccs.cacheService.GetTotalSize()
}

// GetCacheItemCount returns the number of items in the cache
func (ccs *CalendarCacheService) GetCacheItemCount() int64 {
	return ccs.cacheService.GetItemCount()
}

// String returns a string representation of the calendar cache service
func (ccs *CalendarCacheService) String() string {
	stats := ccs.GetCacheStats()
	return fmt.Sprintf("CalendarCacheService{Enabled: %t, Items: %d, Size: %d bytes, HitRatio: %.2f%%}", 
		ccs.config.EnableCache, stats.ItemCount, stats.CacheSize, stats.HitRatio*100)
}
