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

	// Create cache key based on user token and time range
	cacheKey := ccs.createEventsCacheKey(token, start, end)

	// Try to get from cache
	if cached, found := ccs.cacheService.Get(cacheKey); found {
		if events, ok := cached.([]CalendarEvent); ok {
			return events, nil
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
	timeRange := fmt.Sprintf("%s_%s", start.Format("2006-01-02"), end.Format("2006-01-02"))
	key := fmt.Sprintf("%s:events:%s:%s", ccs.config.CacheKeyPrefix, tokenHash, timeRange)
	return models.NewCacheKey("", key)
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
