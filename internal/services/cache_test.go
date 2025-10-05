package services

import (
	"testing"
	"time"

	"woodhome-webapp/internal/models"
)

func TestCacheService(t *testing.T) {
	// Create test configuration
	config := models.CacheConfig{
		DefaultTTL:     5 * time.Minute,
		MaxSize:        1024 * 1024, // 1MB
		MaxItems:       100,
		CleanupInterval: 1 * time.Minute,
		EnableMetrics:  true,
	}

	// Create cache service
	cacheService := NewCacheService(config)

	// Test basic set and get
	key := models.NewCacheKey("test", "key1")
	value := "test value"

	err := cacheService.Set(key, value, 1*time.Minute)
	if err != nil {
		t.Fatalf("Failed to set cache value: %v", err)
	}

	// Test get
	retrieved, found := cacheService.Get(key)
	if !found {
		t.Fatal("Failed to retrieve cached value")
	}

	if retrieved != value {
		t.Fatalf("Expected %v, got %v", value, retrieved)
	}

	// Test cache stats
	stats := cacheService.GetStats()
	if stats.ItemCount != 1 {
		t.Fatalf("Expected item count 1, got %d", stats.ItemCount)
	}

	// Test cache metadata
	metadata := cacheService.GetMetadata()
	if metadata.ItemCount != 1 {
		t.Fatalf("Expected metadata item count 1, got %d", metadata.ItemCount)
	}

	// Test cache health
	if !cacheService.IsHealthy() {
		t.Fatal("Cache should be healthy")
	}

	// Test delete
	cacheService.Delete(key)
	_, found = cacheService.Get(key)
	if found {
		t.Fatal("Value should be deleted")
	}

	// Test clear
	cacheService.Set(key, value, 1*time.Minute)
	cacheService.Clear()
	_, found = cacheService.Get(key)
	if found {
		t.Fatal("Cache should be cleared")
	}
}

func TestCacheExpiration(t *testing.T) {
	config := models.CacheConfig{
		DefaultTTL:     1 * time.Second,
		MaxSize:        1024 * 1024,
		MaxItems:       100,
		CleanupInterval: 100 * time.Millisecond,
		EnableMetrics:  true,
	}

	cacheService := NewCacheService(config)
	key := models.NewCacheKey("test", "expire")
	value := "expire test"

	err := cacheService.Set(key, value, 100*time.Millisecond)
	if err != nil {
		t.Fatalf("Failed to set cache value: %v", err)
	}

	// Value should be available immediately
	_, found := cacheService.Get(key)
	if !found {
		t.Fatal("Value should be available immediately")
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Value should be expired
	_, found = cacheService.Get(key)
	if found {
		t.Fatal("Value should be expired")
	}
}

func TestCacheSizeLimits(t *testing.T) {
	config := models.CacheConfig{
		DefaultTTL:     5 * time.Minute,
		MaxSize:        100, // Very small size limit
		MaxItems:       2,    // Very small item limit
		CleanupInterval: 1 * time.Minute,
		EnableMetrics:  true,
	}

	cacheService := NewCacheService(config)

	// Add items up to the limit
	key1 := models.NewCacheKey("test", "key1")
	key2 := models.NewCacheKey("test", "key2")
	key3 := models.NewCacheKey("test", "key3")

	cacheService.Set(key1, "value1", 1*time.Minute)
	cacheService.Set(key2, "value2", 1*time.Minute)

	// Cache should still be healthy
	if !cacheService.IsHealthy() {
		t.Fatal("Cache should be healthy with 2 items")
	}

	// Add third item - should trigger eviction
	cacheService.Set(key3, "value3", 1*time.Minute)

	// At least one item should still be available
	stats := cacheService.GetStats()
	if stats.ItemCount == 0 {
		t.Fatal("At least one item should be available after eviction")
	}
}
