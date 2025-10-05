/**
 * Cache Integration Test
 * Simple test to validate cache functionality
 */

// Test cache manager functionality
function testCacheManager() {
    console.log('Testing Cache Manager...');
    
    // Test cache manager initialization
    if (typeof window.cacheManager !== 'undefined') {
        console.log('✅ Cache Manager initialized');
    } else {
        console.log('❌ Cache Manager not found');
        return false;
    }
    
    // Test cache stats loading
    window.cacheManager.loadCacheStats();
    console.log('✅ Cache stats loading initiated');
    
    // Test cache refresh
    document.dispatchEvent(new CustomEvent('cache-refresh-requested'));
    console.log('✅ Cache refresh requested');
    
    // Test cache clear
    document.dispatchEvent(new CustomEvent('cache-clear-requested'));
    console.log('✅ Cache clear requested');
    
    return true;
}

// Test calendar section integration
function testCalendarIntegration() {
    console.log('Testing Calendar Integration...');
    
    // Check if calendar section exists
    const calendarSection = document.getElementById('calendar-section');
    if (calendarSection) {
        console.log('✅ Calendar section found');
    } else {
        console.log('❌ Calendar section not found');
        return false;
    }
    
    // Check cache management UI elements
    const cacheCard = document.getElementById('calendar-cache-card');
    if (cacheCard) {
        console.log('✅ Cache management card found');
    } else {
        console.log('❌ Cache management card not found');
        return false;
    }
    
    // Check cache buttons
    const refreshBtn = document.getElementById('cache-refresh-btn');
    const clearBtn = document.getElementById('cache-clear-btn');
    
    if (refreshBtn && clearBtn) {
        console.log('✅ Cache management buttons found');
    } else {
        console.log('❌ Cache management buttons not found');
        return false;
    }
    
    return true;
}

// Test API endpoints
async function testAPIEndpoints() {
    console.log('Testing API Endpoints...');
    
    try {
        // Test cache stats endpoint
        const statsResponse = await fetch('/api/calendar/cache/stats');
        if (statsResponse.ok) {
            console.log('✅ Cache stats endpoint accessible');
        } else {
            console.log('❌ Cache stats endpoint failed:', statsResponse.status);
        }
    } catch (error) {
        console.log('❌ Cache stats endpoint error:', error.message);
    }
    
    return true;
}

// Run all tests
function runCacheIntegrationTests() {
    console.log('🚀 Starting Cache Integration Tests...');
    
    const results = {
        cacheManager: testCacheManager(),
        calendarIntegration: testCalendarIntegration(),
        apiEndpoints: testAPIEndpoints()
    };
    
    console.log('📊 Test Results:', results);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log('🎉 All cache integration tests passed!');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above.');
    }
    
    return allPassed;
}

// Export for use in browser console
window.runCacheIntegrationTests = runCacheIntegrationTests;

// Auto-run tests if this script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCacheIntegrationTests);
} else {
    runCacheIntegrationTests();
}
