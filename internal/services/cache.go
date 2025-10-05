package services

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"woodhome-webapp/internal/models"

	"github.com/patrickmn/go-cache"
)

// CacheService provides thread-safe caching functionality with TTL support
type CacheService struct {
	cache    *cache.Cache
	config   models.CacheConfig
	metadata models.CacheMetadata
	stats    models.CacheStats
	mutex    sync.RWMutex
}

// NewCacheService creates a new cache service with the provided configuration
func NewCacheService(config models.CacheConfig) *CacheService {
	// Convert our config to go-cache config
	defaultExpiration := config.DefaultTTL
	cleanupInterval := config.CleanupInterval
	if cleanupInterval == 0 {
		cleanupInterval = 5 * time.Minute
	}

	c := cache.New(defaultExpiration, cleanupInterval)

	return &CacheService{
		cache: c,
		config: config,
		metadata: models.CacheMetadata{
			CreatedAt: time.Now(),
		},
		stats: models.CacheStats{},
	}
}

// Set stores a value in the cache with the specified TTL
func (cs *CacheService) Set(key models.CacheKey, value interface{}, ttl time.Duration) error {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	// Check if we need to evict items due to size limits
	if cs.shouldEvict() {
		cs.evictOldest()
	}

	// Create cache entry
	entry := models.CacheEntry{
		Data:      value,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(ttl),
		Key:       key.FullKey,
		Size:      cs.calculateSize(value),
	}

	// Store in cache
	cs.cache.Set(key.FullKey, entry, ttl)

	// Update metadata
	cs.metadata.ItemCount++
	cs.metadata.TotalSize += entry.Size
	cs.metadata.LastAccessed = time.Now()

	return nil
}

// Get retrieves a value from the cache
func (cs *CacheService) Get(key models.CacheKey) (interface{}, bool) {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	// Try to get from cache
	if item, found := cs.cache.Get(key.FullKey); found {
		entry, ok := item.(models.CacheEntry)
		if !ok {
			// Invalid entry type, remove it
			cs.cache.Delete(key.FullKey)
			cs.metadata.MissCount++
			return nil, false
		}

		// Check if entry is still valid
		if entry.IsValid() {
			cs.metadata.HitCount++
			cs.metadata.LastAccessed = time.Now()
			return entry.Data, true
		} else {
			// Entry expired, remove it
			cs.cache.Delete(key.FullKey)
			cs.metadata.ItemCount--
			cs.metadata.TotalSize -= entry.Size
		}
	}

	cs.metadata.MissCount++
	return nil, false
}

// Delete removes a value from the cache
func (cs *CacheService) Delete(key models.CacheKey) {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	if item, found := cs.cache.Get(key.FullKey); found {
		if entry, ok := item.(models.CacheEntry); ok {
			cs.metadata.ItemCount--
			cs.metadata.TotalSize -= entry.Size
		}
	}
	cs.cache.Delete(key.FullKey)
}

// Clear removes all items from the cache
func (cs *CacheService) Clear() {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	cs.cache.Flush()
	cs.metadata = models.CacheMetadata{
		CreatedAt: time.Now(),
	}
	cs.stats = models.CacheStats{}
}

// Exists checks if a key exists in the cache
func (cs *CacheService) Exists(key models.CacheKey) bool {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	if item, found := cs.cache.Get(key.FullKey); found {
		if entry, ok := item.(models.CacheEntry); ok {
			return entry.IsValid()
		}
	}
	return false
}

// GetStats returns cache performance statistics
func (cs *CacheService) GetStats() models.CacheStats {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	totalRequests := cs.metadata.HitCount + cs.metadata.MissCount
	hitRatio := float64(0)
	if totalRequests > 0 {
		hitRatio = float64(cs.metadata.HitCount) / float64(totalRequests)
	}

	return models.CacheStats{
		HitRatio:      hitRatio,
		TotalRequests: totalRequests,
		CacheSize:     cs.metadata.TotalSize,
		ItemCount:     cs.metadata.ItemCount,
		LastCleanup:   time.Now(),
		MemoryUsage:   cs.metadata.TotalSize,
	}
}

// GetMetadata returns cache metadata
func (cs *CacheService) GetMetadata() models.CacheMetadata {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	return cs.metadata
}

// shouldEvict checks if we need to evict items based on size limits
func (cs *CacheService) shouldEvict() bool {
	if cs.config.MaxSize > 0 && cs.metadata.TotalSize >= cs.config.MaxSize {
		return true
	}
	if cs.config.MaxItems > 0 && cs.metadata.ItemCount >= cs.config.MaxItems {
		return true
	}
	return false
}

// evictOldest removes the oldest items from the cache
func (cs *CacheService) evictOldest() {
	// Get all items and sort by creation time
	items := cs.cache.Items()
	
	// Simple eviction: remove items that are close to expiration
	for key, item := range items {
		if entry, ok := item.Object.(models.CacheEntry); ok {
			// Remove items that are within 1 minute of expiration
			if entry.TimeUntilExpiry() < time.Minute {
				cs.cache.Delete(key)
				cs.metadata.ItemCount--
				cs.metadata.TotalSize -= entry.Size
			}
		}
	}
}

// calculateSize estimates the size of a value in bytes
func (cs *CacheService) calculateSize(value interface{}) int64 {
	// Simple size estimation
	if data, err := json.Marshal(value); err == nil {
		return int64(len(data))
	}
	// Fallback estimation
	return 1024 // 1KB default
}

// Cleanup removes expired items from the cache
func (cs *CacheService) Cleanup() {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	items := cs.cache.Items()
	
	for key, item := range items {
		if entry, ok := item.Object.(models.CacheEntry); ok {
			if entry.IsExpired() {
				cs.cache.Delete(key)
				cs.metadata.ItemCount--
				cs.metadata.TotalSize -= entry.Size
			}
		}
	}
}

// GetConfig returns the current cache configuration
func (cs *CacheService) GetConfig() models.CacheConfig {
	return cs.config
}

// UpdateConfig updates the cache configuration
func (cs *CacheService) UpdateConfig(newConfig models.CacheConfig) {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	cs.config = newConfig
}

// GetItemCount returns the number of items in the cache
func (cs *CacheService) GetItemCount() int64 {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	return cs.metadata.ItemCount
}

// GetTotalSize returns the total size of cached data
func (cs *CacheService) GetTotalSize() int64 {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	return cs.metadata.TotalSize
}

// IsHealthy checks if the cache service is healthy
func (cs *CacheService) IsHealthy() bool {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	// Check if we're within size limits
	if cs.config.MaxSize > 0 && cs.metadata.TotalSize > cs.config.MaxSize {
		return false
	}
	if cs.config.MaxItems > 0 && cs.metadata.ItemCount > cs.config.MaxItems {
		return false
	}

	return true
}

// String returns a string representation of the cache service
func (cs *CacheService) String() string {
	stats := cs.GetStats()
	return fmt.Sprintf("CacheService{Items: %d, Size: %d bytes, HitRatio: %.2f%%}", 
		stats.ItemCount, stats.CacheSize, stats.HitRatio*100)
}
