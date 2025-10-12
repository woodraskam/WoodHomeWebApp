/**
 * Cache Manager
 * Handles cache state management and user interface for calendar caching
 */
class CacheManager {
    constructor() {
        this.cacheStats = null;
        this.cacheMetadata = null;
        this.cacheConfig = null;
        this.isHealthy = true;
        this.lastRefresh = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCacheState();
    }

    setupEventListeners() {
        // Listen for cache refresh requests
        document.addEventListener('cache-refresh-requested', () => {
            this.refreshCache();
        });

        // Listen for cache clear requests
        document.addEventListener('cache-clear-requested', () => {
            this.clearCache();
        });

        // Listen for cache stats requests
        document.addEventListener('cache-stats-requested', () => {
            this.loadCacheStats();
        });

        // Set up periodic cache stats updates
        this.refreshInterval = setInterval(() => {
            this.loadCacheStats();
        }, 30000); // Update every 30 seconds
    }

    async loadCacheStats() {
        try {
            const response = await fetch('/api/calendar/cache/stats');
            if (response.ok) {
                const data = await response.json();
                this.cacheStats = data.stats;
                this.cacheMetadata = data.metadata;
                this.cacheConfig = data.config;
                this.isHealthy = data.healthy;
                
                // Update UI with cache information
                this.updateCacheStatusUI();
                
                // Dispatch event with cache stats
                document.dispatchEvent(new CustomEvent('cache-stats-updated', {
                    detail: {
                        stats: this.cacheStats,
                        metadata: this.cacheMetadata,
                        config: this.cacheConfig,
                        healthy: this.isHealthy
                    }
                }));
            } else {
                console.error('Failed to load cache stats:', response.status, response.statusText);
                this.isHealthy = false;
                this.updateCacheStatusUI();
            }
        } catch (error) {
            console.error('Error loading cache stats:', error);
            this.isHealthy = false;
            this.updateCacheStatusUI();
        }
    }

    async refreshCache() {
        try {
            this.showRefreshLoading();
            
            const response = await fetch('/api/calendar/cache/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Cache refreshed successfully:', result.message);
                
                // Update last refresh time
                this.lastRefresh = new Date();
                this.saveCacheState();
                
                // Reload cache stats
                await this.loadCacheStats();
                
                // Dispatch refresh success event
                document.dispatchEvent(new CustomEvent('cache-refreshed', {
                    detail: { success: true, message: result.message }
                }));
                
                this.hideRefreshLoading();
            } else {
                console.error('Failed to refresh cache:', response.status, response.statusText);
                this.hideRefreshLoading();
                
                // Dispatch refresh failure event
                document.dispatchEvent(new CustomEvent('cache-refresh-failed', {
                    detail: { success: false, error: 'Failed to refresh cache' }
                }));
            }
        } catch (error) {
            console.error('Error refreshing cache:', error);
            this.hideRefreshLoading();
            
            // Dispatch refresh failure event
            document.dispatchEvent(new CustomEvent('cache-refresh-failed', {
                detail: { success: false, error: error.message }
            }));
        }
    }

    async clearCache() {
        try {
            this.showClearLoading();
            
            const response = await fetch('/api/calendar/cache/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Cache cleared successfully:', result.message);
                
                // Reset cache state
                this.cacheStats = null;
                this.cacheMetadata = null;
                this.lastRefresh = null;
                this.saveCacheState();
                
                // Reload cache stats
                await this.loadCacheStats();
                
                // Dispatch clear success event
                document.dispatchEvent(new CustomEvent('cache-cleared', {
                    detail: { success: true, message: result.message }
                }));
                
                this.hideClearLoading();
            } else {
                console.error('Failed to clear cache:', response.status, response.statusText);
                this.hideClearLoading();
                
                // Dispatch clear failure event
                document.dispatchEvent(new CustomEvent('cache-clear-failed', {
                    detail: { success: false, error: 'Failed to clear cache' }
                }));
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.hideClearLoading();
            
            // Dispatch clear failure event
            document.dispatchEvent(new CustomEvent('cache-clear-failed', {
                detail: { success: false, error: error.message }
            }));
        }
    }

    updateCacheStatusUI() {
        // Update cache status indicator
        const statusIndicator = document.getElementById('cache-status-indicator');
        if (statusIndicator) {
            if (this.isHealthy) {
                statusIndicator.className = 'cache-status-indicator healthy';
                statusIndicator.title = 'Cache is healthy';
            } else {
                statusIndicator.className = 'cache-status-indicator unhealthy';
                statusIndicator.title = 'Cache has issues';
            }
        }

        // Update cache age display
        this.updateCacheAgeDisplay();

        // Update cache stats display
        this.updateCacheStatsDisplay();
    }

    updateCacheAgeDisplay() {
        const ageDisplay = document.getElementById('cache-age-display');
        if (ageDisplay && this.lastRefresh) {
            const age = this.getCacheAge();
            ageDisplay.textContent = this.formatCacheAge(age);
            ageDisplay.title = `Last refreshed: ${this.lastRefresh.toLocaleString()}`;
        }
    }

    updateCacheStatsDisplay() {
        const statsDisplay = document.getElementById('cache-stats-display');
        if (statsDisplay && this.cacheStats) {
            const hitRatio = (this.cacheStats.hitRatio * 100).toFixed(1);
            const itemCount = this.cacheStats.itemCount;
            const cacheSize = this.formatBytes(this.cacheStats.cacheSize);
            
            statsDisplay.innerHTML = `
                <div class="cache-stat">
                    <span class="stat-label">Hit Ratio:</span>
                    <span class="stat-value">${hitRatio}%</span>
                </div>
                <div class="cache-stat">
                    <span class="stat-label">Items:</span>
                    <span class="stat-value">${itemCount}</span>
                </div>
                <div class="cache-stat">
                    <span class="stat-label">Size:</span>
                    <span class="stat-value">${cacheSize}</span>
                </div>
            `;
        }
    }

    getCacheAge() {
        if (!this.lastRefresh) return null;
        return new Date() - this.lastRefresh;
    }

    formatCacheAge(age) {
        if (!age) return 'Unknown';
        
        const seconds = Math.floor(age / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) {
            return `${seconds}s ago`;
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else {
            return `${hours}h ago`;
        }
    }

    formatBytes(bytes) {
        if (!bytes) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showRefreshLoading() {
        const refreshBtn = document.getElementById('cache-refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="loading-spinner"></span> Refreshing...';
        }
    }

    hideRefreshLoading() {
        const refreshBtn = document.getElementById('cache-refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = 'Refresh Cache';
        }
    }

    showClearLoading() {
        const clearBtn = document.getElementById('cache-clear-btn');
        if (clearBtn) {
            clearBtn.disabled = true;
            clearBtn.innerHTML = '<span class="loading-spinner"></span> Clearing...';
        }
    }

    hideClearLoading() {
        const clearBtn = document.getElementById('cache-clear-btn');
        if (clearBtn) {
            clearBtn.disabled = false;
            clearBtn.innerHTML = 'Clear Cache';
        }
    }

    loadCacheState() {
        try {
            const savedState = localStorage.getItem('calendar-cache-state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.lastRefresh = state.lastRefresh ? new Date(state.lastRefresh) : null;
            }
        } catch (error) {
            console.error('Error loading cache state:', error);
        }
    }

    saveCacheState() {
        try {
            const state = {
                lastRefresh: this.lastRefresh ? this.lastRefresh.toISOString() : null
            };
            localStorage.setItem('calendar-cache-state', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving cache state:', error);
        }
    }

    // Public methods for external use
    getCacheStats() {
        return this.cacheStats;
    }

    getCacheMetadata() {
        return this.cacheMetadata;
    }

    getCacheConfig() {
        return this.cacheConfig;
    }

    isCacheHealthy() {
        return this.isHealthy;
    }

    getLastRefresh() {
        return this.lastRefresh;
    }

    // Cleanup method
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Create global cache manager instance
window.cacheManager = new CacheManager();
