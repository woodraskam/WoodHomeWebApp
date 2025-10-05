package models

import (
	"time"
)

// CacheEntry represents a cached item with metadata
type CacheEntry struct {
	Data      interface{} `json:"data"`
	CreatedAt time.Time  `json:"createdAt"`
	ExpiresAt time.Time  `json:"expiresAt"`
	Key       string     `json:"key"`
	Size      int64      `json:"size"`
}

// CacheMetadata contains cache statistics and configuration
type CacheMetadata struct {
	HitCount     int64     `json:"hitCount"`
	MissCount    int64     `json:"missCount"`
	TotalSize    int64     `json:"totalSize"`
	ItemCount    int64     `json:"itemCount"`
	LastAccessed time.Time `json:"lastAccessed"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CacheConfig holds cache configuration settings
type CacheConfig struct {
	DefaultTTL    time.Duration `json:"defaultTTL"`
	MaxSize       int64         `json:"maxSize"`
	MaxItems      int64         `json:"maxItems"`
	CleanupInterval time.Duration `json:"cleanupInterval"`
	EnableMetrics bool          `json:"enableMetrics"`
}

// CacheStats provides cache performance statistics
type CacheStats struct {
	HitRatio      float64   `json:"hitRatio"`
	TotalRequests int64     `json:"totalRequests"`
	CacheSize     int64     `json:"cacheSize"`
	ItemCount     int64     `json:"itemCount"`
	LastCleanup   time.Time `json:"lastCleanup"`
	MemoryUsage   int64     `json:"memoryUsage"`
}

// CacheKey represents a cache key with optional namespace
type CacheKey struct {
	Namespace string `json:"namespace"`
	Key       string `json:"key"`
	FullKey   string `json:"fullKey"`
}

// NewCacheKey creates a new cache key
func NewCacheKey(namespace, key string) CacheKey {
	fullKey := key
	if namespace != "" {
		fullKey = namespace + ":" + key
	}
	return CacheKey{
		Namespace: namespace,
		Key:       key,
		FullKey:   fullKey,
	}
}

// IsExpired checks if the cache entry has expired
func (ce *CacheEntry) IsExpired() bool {
	return time.Now().After(ce.ExpiresAt)
}

// Age returns the age of the cache entry
func (ce *CacheEntry) Age() time.Duration {
	return time.Since(ce.CreatedAt)
}

// TimeUntilExpiry returns the time until the cache entry expires
func (ce *CacheEntry) TimeUntilExpiry() time.Duration {
	return time.Until(ce.ExpiresAt)
}

// IsValid checks if the cache entry is valid (not expired and has data)
func (ce *CacheEntry) IsValid() bool {
	return !ce.IsExpired() && ce.Data != nil
}
