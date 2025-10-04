/**
 * SPA Application Initialization
 * Main application entry point and initialization
 */
class SPAApp {
    constructor() {
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupAuthentication();
        this.setupApp();
        this.setupErrorHandling();
    }

    /**
     * Setup authentication
     */
    setupAuthentication() {
        // Check if user is already authenticated
        this.checkAuthenticationStatus();

        // Setup auth button
        const authButton = document.getElementById('auth-google-btn');
        if (authButton) {
            authButton.addEventListener('click', () => {
                this.authenticate();
            });
        }
    }

    /**
     * Check authentication status
     */
    checkAuthenticationStatus() {
        // Check for existing authentication
        const authToken = localStorage.getItem('auth-token');
        if (authToken) {
            this.isAuthenticated = true;
            this.showApp();
        } else {
            // Check if we're coming back from OAuth callback
            this.checkOAuthCallback();
        }
    }

    /**
     * Check if we're returning from OAuth callback
     */
    checkOAuthCallback() {
        // Check URL parameters for OAuth success
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth') === 'success';

        if (authSuccess) {
            // OAuth was successful, hide overlay and show app
            this.isAuthenticated = true;
            localStorage.setItem('auth-token', 'authenticated');
            this.showApp();

            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        } else {
            this.showAuthOverlay();
        }
    }

    /**
     * Show authentication overlay
     */
    showAuthOverlay() {
        const authOverlay = document.getElementById('auth-overlay');
        const spaApp = document.getElementById('spa-app');

        if (authOverlay) {
            authOverlay.style.display = 'flex';
        }
        if (spaApp) {
            spaApp.style.display = 'none';
        }
    }

    /**
     * Show main app
     */
    showApp() {
        const authOverlay = document.getElementById('auth-overlay');
        const spaApp = document.getElementById('spa-app');

        if (authOverlay) {
            authOverlay.style.display = 'none';
        }
        if (spaApp) {
            spaApp.style.display = 'flex';
        }
    }

    /**
     * Authenticate user
     */
    authenticate() {
        // Redirect to Google OAuth
        const authUrl = '/auth/google/login';
        window.location.href = authUrl;
    }

    /**
     * Setup main app
     */
    setupApp() {
        // Initialize theme manager
        if (window.m3ThemeManager) {
            window.m3ThemeManager.applyAccessibilityPreferences();
        }

        // Initialize navigation manager
        if (window.m3NavigationManager) {
            // Navigation is already initialized
        }

        // Initialize router
        if (window.spaRouter) {
            // Router is already initialized
        }

        // Setup global event listeners
        this.setupGlobalEventListeners();
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle route changes
        document.addEventListener('routechange', (e) => {
            console.log('Route changed to:', e.detail?.section);
        });

        // Handle section changes
        document.addEventListener('sectionchange', (e) => {
            console.log('Section changed to:', e.detail?.section);
        });

        // Handle theme changes
        document.addEventListener('themechange', (e) => {
            console.log('Theme changed to:', e.detail?.theme);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Trigger responsive behavior updates
        if (window.m3NavigationManager) {
            // Navigation manager handles responsive behavior
        }
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // App is hidden - pause any active processes
            this.pauseApp();
        } else {
            // App is visible - resume processes
            this.resumeApp();
        }
    }

    /**
     * Pause app processes
     */
    pauseApp() {
        // Pause any active timers, animations, etc.
        console.log('App paused');
    }

    /**
     * Resume app processes
     */
    resumeApp() {
        // Resume any paused processes
        console.log('App resumed');
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleError(e.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleError(e.reason);
        });
    }

    /**
     * Handle errors
     */
    handleError(error) {
        // Log error
        console.error('SPA Error:', error);

        // Show user-friendly error message
        this.showErrorMessage('An unexpected error occurred. Please refresh the page.');
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'm3-error-notification';
        errorDiv.innerHTML = `
      <div class="m3-error-notification__content">
        <svg class="m3-icon" viewBox="0 0 24 24">
          <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
        </svg>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Get app state
     */
    getAppState() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentSection: window.m3NavigationManager ? window.m3NavigationManager.getCurrentSection() : null,
            currentTheme: window.m3ThemeManager ? window.m3ThemeManager.getCurrentTheme() : 'light'
        };
    }

    /**
     * Save app state
     */
    saveAppState() {
        const state = this.getAppState();
        localStorage.setItem('spa-app-state', JSON.stringify(state));
    }

    /**
     * Load app state
     */
    loadAppState() {
        const savedState = localStorage.getItem('spa-app-state');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                return state;
            } catch (e) {
                console.error('Failed to load app state:', e);
            }
        }
        return null;
    }
}

// Initialize SPA app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spaApp = new SPAApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPAApp;
}
