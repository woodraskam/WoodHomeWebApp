/**
 * Authenticated Section Base Class
 * Abstract base class for sections that require authentication
 */
class AuthenticatedSection {
    constructor() {
        this.requiresAuth = true;
        this.isActive = false;
        this.isLoaded = false;
        this.sectionName = this.constructor.name;

        console.log(`${this.sectionName}: Constructor called`);

        // Setup authentication listener
        this.setupAuthenticationListener();

        // Register with authentication manager
        this.registerWithAuthenticationManager();
    }

    /**
     * Setup authentication state listener
     */
    setupAuthenticationListener() {
        if (window.authenticationManager) {
            window.authenticationManager.addEventListener('authentication:changed', (e) => {
                console.log(`${this.sectionName}: Authentication state changed to: ${e.detail.authenticated}`);

                if (e.detail.authenticated) {
                    this.activate();
                } else {
                    this.deactivate();
                }
            });

            // Check current authentication state
            const authState = window.authenticationManager.getAuthenticationState();
            if (authState.isAuthenticated) {
                this.activate();
            }
        } else {
            console.warn(`${this.sectionName}: AuthenticationManager not available`);
        }
    }

    /**
     * Register with authentication manager
     */
    registerWithAuthenticationManager() {
        if (window.authenticationManager) {
            window.authenticationManager.registerService(this.sectionName, this, this.requiresAuth);
            console.log(`${this.sectionName}: Registered with AuthenticationManager`);
        } else {
            console.warn(`${this.sectionName}: AuthenticationManager not available for registration`);
        }
    }

    /**
     * Activate the section
     */
    activate() {
        if (this.isActive) {
            console.log(`${this.sectionName}: Already active`);
            return;
        }

        console.log(`${this.sectionName}: Activating...`);
        this.isActive = true;

        // Initialize if not already loaded
        if (!this.isLoaded) {
            this.initialize();
            this.isLoaded = true;
        }

        // Show the section
        this.show();
    }

    /**
     * Deactivate the section
     */
    deactivate() {
        if (!this.isActive) {
            console.log(`${this.sectionName}: Already inactive`);
            return;
        }

        console.log(`${this.sectionName}: Deactivating...`);
        this.isActive = false;

        // Hide the section
        this.hide();

        // Cleanup if needed
        this.cleanup();
    }

    /**
     * Initialize the section (to be implemented by subclasses)
     */
    initialize() {
        console.log(`${this.sectionName}: Initialize method called - should be implemented by subclass`);
        // This method should be overridden by subclasses
    }

    /**
     * Show the section (to be implemented by subclasses)
     */
    show() {
        console.log(`${this.sectionName}: Show method called - should be implemented by subclass`);
        // This method should be overridden by subclasses
    }

    /**
     * Hide the section (to be implemented by subclasses)
     */
    hide() {
        console.log(`${this.sectionName}: Hide method called - should be implemented by subclass`);
        // This method should be overridden by subclasses
    }

    /**
     * Cleanup the section (to be implemented by subclasses)
     */
    cleanup() {
        console.log(`${this.sectionName}: Cleanup method called - should be implemented by subclass`);
        // This method should be overridden by subclasses
    }

    /**
     * Check if section is active
     */
    isSectionActive() {
        return this.isActive;
    }

    /**
     * Check if section is loaded
     */
    isSectionLoaded() {
        return this.isLoaded;
    }

    /**
     * Get section name
     */
    getSectionName() {
        return this.sectionName;
    }

    /**
     * Get authentication state
     */
    getAuthenticationState() {
        if (window.authenticationManager) {
            return window.authenticationManager.getAuthenticationState();
        }
        return { isAuthenticated: false, userInfo: null, authToken: null };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const authState = this.getAuthenticationState();
        return authState.isAuthenticated;
    }

    /**
     * Get user info
     */
    getUserInfo() {
        const authState = this.getAuthenticationState();
        return authState.userInfo;
    }

    /**
     * Show authentication required message
     */
    showAuthenticationRequired() {
        console.log(`${this.sectionName}: Authentication required`);
        // This method can be overridden by subclasses to show custom auth messages
    }

    /**
     * Handle authentication error
     */
    handleAuthenticationError(error) {
        console.error(`${this.sectionName}: Authentication error:`, error);
        // This method can be overridden by subclasses to handle auth errors
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticatedSection;
}
