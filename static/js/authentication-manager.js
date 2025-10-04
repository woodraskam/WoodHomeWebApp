/**
 * Authentication Manager
 * Centralized authentication state management for SPA
 */
class AuthenticationManager {
    constructor() {
        this.isAuthenticated = false;
        this.services = new Map();
        this.eventTarget = new EventTarget();
        this.authToken = null;
        this.userInfo = null;

        // Initialize on creation
        this.init();
    }

    /**
     * Initialize authentication manager
     */
    init() {
        console.log('AuthenticationManager: Initializing...');
        this.loadAuthenticationState();
        this.setupEventListeners();

        // Check authentication status with server on initialization
        this.checkAuthenticationStatus();
    }

    /**
     * Load authentication state from storage
     */
    loadAuthenticationState() {
        try {
            // Check for existing authentication
            this.authToken = localStorage.getItem('auth-token');
            const userInfoStr = localStorage.getItem('user-info');

            if (this.authToken && userInfoStr) {
                this.userInfo = JSON.parse(userInfoStr);
                this.isAuthenticated = true;
                console.log('AuthenticationManager: Found existing authentication');
            } else {
                console.log('AuthenticationManager: No existing authentication found');
            }
        } catch (error) {
            console.error('AuthenticationManager: Error loading authentication state:', error);
            this.clearAuthenticationState();
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Listen for OAuth callback
        window.addEventListener('load', () => {
            this.checkOAuthCallback();
        });

        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth-token' || e.key === 'user-info') {
                this.loadAuthenticationState();
                this.notifyAuthenticationChange();
            }
        });
    }

    /**
     * Set authentication state
     */
    setAuthenticationState(token, userInfo) {
        this.authToken = token;
        this.userInfo = userInfo;
        this.isAuthenticated = true;
        this.saveAuthenticationState();
        this.notifyAuthenticationChange();
    }

    /**
     * Clear authentication state
     */
    clearAuthenticationState() {
        this.authToken = null;
        this.userInfo = null;
        this.isAuthenticated = false;
        this.saveAuthenticationState();
        this.notifyAuthenticationChange();
    }

    /**
     * Notify all listeners of authentication state change
     */
    notifyAuthenticationChange() {
        const event = new CustomEvent('authentication:changed', {
            detail: {
                authenticated: this.isAuthenticated,
                token: this.authToken,
                userInfo: this.userInfo
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Check if we're returning from OAuth callback
     */
    checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            console.log('AuthenticationManager: OAuth callback detected');
            // OAuth callback will be handled by the backend
            // We'll check authentication status after a short delay
            setTimeout(() => {
                this.checkAuthenticationStatus();
            }, 1000);
        }
    }

    /**
     * Check current authentication status with server
     */
    async checkAuthenticationStatus() {
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.setAuthenticationState(true, data.user);
                    return true;
                }
            }

            // Not authenticated
            this.setAuthenticationState(false);
            return false;
        } catch (error) {
            console.error('AuthenticationManager: Error checking authentication status:', error);
            this.setAuthenticationState(false);
            return false;
        }
    }

    /**
     * Set authentication state
     */
    setAuthenticationState(authenticated, userInfo = null) {
        const wasAuthenticated = this.isAuthenticated;
        this.isAuthenticated = authenticated;
        this.userInfo = userInfo;

        if (authenticated) {
            // Store authentication data
            if (this.authToken) {
                localStorage.setItem('auth-token', this.authToken);
            }
            if (userInfo) {
                localStorage.setItem('user-info', JSON.stringify(userInfo));
            }

            // Activate authenticated services
            this.activateAuthenticatedServices();
        } else {
            // Clear authentication data
            this.clearAuthenticationState();

            // Deactivate all services
            this.deactivateAllServices();
        }

        // Notify listeners if state changed
        if (wasAuthenticated !== authenticated) {
            this.notifyAuthenticationChange();
        }
    }

    /**
     * Clear authentication state
     */
    clearAuthenticationState() {
        this.isAuthenticated = false;
        this.authToken = null;
        this.userInfo = null;

        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-info');
    }

    /**
     * Register a service with the authentication manager
     */
    registerService(serviceName, service, requiresAuth = true) {
        console.log(`AuthenticationManager: Registering service '${serviceName}' (requiresAuth: ${requiresAuth})`);

        this.services.set(serviceName, {
            service,
            requiresAuth,
            isActive: false
        });

        // If authenticated and service requires auth, activate it
        if (this.isAuthenticated && requiresAuth) {
            this.activateService(serviceName);
        } else if (!requiresAuth) {
            // Service doesn't require auth, activate it
            this.activateService(serviceName);
        }
    }

    /**
     * Activate a specific service
     */
    activateService(serviceName) {
        const serviceData = this.services.get(serviceName);
        if (!serviceData) {
            console.warn(`AuthenticationManager: Service '${serviceName}' not found`);
            return;
        }

        if (serviceData.isActive) {
            console.log(`AuthenticationManager: Service '${serviceName}' already active`);
            return;
        }

        console.log(`AuthenticationManager: Activating service '${serviceName}'`);
        serviceData.isActive = true;

        // Notify service of activation
        this.eventTarget.dispatchEvent(new CustomEvent('service:activate', {
            detail: { serviceName, service: serviceData.service }
        }));

        // Call service's activate method if it exists
        if (typeof serviceData.service.activate === 'function') {
            serviceData.service.activate();
        }
    }

    /**
     * Deactivate a specific service
     */
    deactivateService(serviceName) {
        const serviceData = this.services.get(serviceName);
        if (!serviceData) {
            console.warn(`AuthenticationManager: Service '${serviceName}' not found`);
            return;
        }

        if (!serviceData.isActive) {
            console.log(`AuthenticationManager: Service '${serviceName}' already inactive`);
            return;
        }

        console.log(`AuthenticationManager: Deactivating service '${serviceName}'`);
        serviceData.isActive = false;

        // Notify service of deactivation
        this.eventTarget.dispatchEvent(new CustomEvent('service:deactivate', {
            detail: { serviceName, service: serviceData.service }
        }));

        // Call service's deactivate method if it exists
        if (typeof serviceData.service.deactivate === 'function') {
            serviceData.service.deactivate();
        }
    }

    /**
     * Activate all authenticated services
     */
    activateAuthenticatedServices() {
        console.log('AuthenticationManager: Activating authenticated services');
        for (const [serviceName, serviceData] of this.services) {
            if (serviceData.requiresAuth && !serviceData.isActive) {
                this.activateService(serviceName);
            }
        }
    }

    /**
     * Deactivate all services
     */
    deactivateAllServices() {
        console.log('AuthenticationManager: Deactivating all services');
        for (const [serviceName, serviceData] of this.services) {
            if (serviceData.isActive) {
                this.deactivateService(serviceName);
            }
        }
    }

    /**
     * Notify listeners of authentication state change
     */
    notifyAuthenticationChange() {
        console.log(`AuthenticationManager: Authentication state changed to: ${this.isAuthenticated}`);
        this.eventTarget.dispatchEvent(new CustomEvent('authentication:changed', {
            detail: {
                authenticated: this.isAuthenticated,
                userInfo: this.userInfo
            }
        }));
    }


    /**
     * Get current authentication state
     */
    getAuthenticationState() {
        return {
            isAuthenticated: this.isAuthenticated,
            userInfo: this.userInfo,
            authToken: this.authToken
        };
    }

    /**
     * Get list of registered services
     */
    getRegisteredServices() {
        const services = [];
        for (const [name, data] of this.services) {
            services.push({
                name,
                requiresAuth: data.requiresAuth,
                isActive: data.isActive
            });
        }
        return services;
    }

    /**
     * Add event listener for authentication events
     */
    addEventListener(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        this.eventTarget.removeEventListener(event, callback);
    }
}

// Create global instance
window.authenticationManager = new AuthenticationManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationManager;
}
