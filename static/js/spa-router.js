/**
 * SPA Router
 * Handles client-side routing with hash-based navigation
 */
class SPARouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        this.setupRoutes();
        this.setupHashChangeListener();
        this.setupPopstateListener();
        this.handleInitialRoute();
    }

    /**
     * Setup route definitions
     */
    setupRoutes() {
        // Define routes
        this.routes.set('home', {
            path: '#home',
            section: 'home',
            title: 'Home Dashboard',
            handler: () => this.loadSection('home')
        });

        this.routes.set('hue', {
            path: '#hue',
            section: 'hue',
            title: 'Hue Lighting',
            handler: () => this.loadSection('hue')
        });

        this.routes.set('sonos', {
            path: '#sonos',
            section: 'sonos',
            title: 'Sonos Audio',
            handler: () => this.loadSection('sonos')
        });

        this.routes.set('calendar', {
            path: '#calendar',
            section: 'calendar',
            title: 'Calendar',
            handler: () => this.loadSection('calendar')
        });

        this.routes.set('games', {
            path: '#games',
            section: 'games',
            title: 'Games',
            handler: () => this.loadSection('games')
        });
    }

    /**
     * Setup hash change listener
     */
    setupHashChangeListener() {
        window.addEventListener('hashchange', (e) => {
            this.handleRouteChange();
        });
    }

    /**
     * Setup popstate listener for browser back/forward
     */
    setupPopstateListener() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.navigateToSection(e.state.section, false);
            } else {
                this.handleRouteChange();
            }
        });
    }

    /**
     * Handle initial route on page load
     */
    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.navigateToSection(hash, false);
        } else {
            this.navigateToSection('home', false);
        }
    }

    /**
     * Handle route changes
     */
    handleRouteChange() {
        const hash = window.location.hash.substring(1);
        this.navigateToSection(hash, false);
    }

    /**
     * Navigate to a specific section
     */
    navigateToSection(section, updateHistory = true) {
        const route = this.routes.get(section);
        if (!route) {
            console.warn(`Route not found: ${section}`);
            this.navigateToSection('home', updateHistory);
            return;
        }

        this.currentRoute = route;

        // Update page title
        document.title = `${route.title} - WoodHome Dashboard`;

        // Update navigation state
        if (window.m3NavigationManager) {
            window.m3NavigationManager.navigateToSection(section);
        }

        // Execute route handler
        route.handler();

        // Update history if requested
        if (updateHistory) {
            history.pushState({ section }, '', route.path);
        }

        // Dispatch route change event
        this.dispatchRouteChangeEvent(route);
    }

    /**
     * Load section content
     */
    loadSection(section) {
        // Hide all sections
        this.hideAllSections();

        // Loading indicator removed to prevent overlay issues

        // Load section-specific content
        this.loadSectionContent(section);
    }

    /**
     * Hide all sections
     */
    hideAllSections() {
        const sections = document.querySelectorAll('.m3-section');
        sections.forEach(section => {
            section.classList.remove('m3-section--active');
        });
    }

    // Loading indicator methods removed to prevent overlay issues

    /**
     * Load section-specific content
     */
    loadSectionContent(section) {
        // Dispatch section load event
        const event = new CustomEvent('sectionload', {
            detail: { section }
        });
        document.dispatchEvent(event);

        // Simulate loading delay for smooth transitions
        setTimeout(() => {
            // Loading indicator removed - no longer needed
            this.showSection(section);
        }, 150);
    }

    /**
     * Show specific section
     */
    showSection(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.add('m3-section--active');
        }
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Get current section
     */
    getCurrentSection() {
        return this.currentRoute ? this.currentRoute.section : null;
    }

    /**
     * Check if route exists
     */
    hasRoute(section) {
        return this.routes.has(section);
    }

    /**
     * Add new route
     */
    addRoute(section, routeConfig) {
        this.routes.set(section, routeConfig);
    }

    /**
     * Remove route
     */
    removeRoute(section) {
        this.routes.delete(section);
    }

    /**
     * Dispatch route change event
     */
    dispatchRouteChangeEvent(route) {
        const event = new CustomEvent('routechange', {
            detail: {
                route: route,
                section: route.section,
                title: route.title
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Navigate back
     */
    goBack() {
        history.back();
    }

    /**
     * Navigate forward
     */
    goForward() {
        history.forward();
    }

    /**
     * Get all routes
     */
    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    /**
     * Check if navigation is supported
     */
    isNavigationSupported() {
        return 'history' in window && 'pushState' in history;
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spaRouter = new SPARouter();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPARouter;
}
