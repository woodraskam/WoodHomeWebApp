/**
 * Material Design 3 Navigation Manager
 * Handles navigation rail, drawer, and bottom navigation with responsive behavior
 */
class M3NavigationManager {
    constructor() {
        this.currentSection = 'home';
        this.isDrawerOpen = false;
        this.isRailExpanded = false;
        this.init();
    }

    init() {
        this.setupNavigationRail();
        this.setupNavigationDrawer();
        this.setupBottomNavigation();
        this.setupResponsiveBehavior();
        this.setupAccessibility();
        this.setupKeyboardNavigation();
        this.loadSavedSection();
    }

    /**
     * Setup navigation rail functionality
     */
    setupNavigationRail() {
        const rail = document.querySelector('.m3-navigation-rail');
        if (!rail) return;

        const destinations = rail.querySelectorAll('.m3-navigation-rail__destination');

        destinations.forEach(dest => {
            dest.addEventListener('click', (e) => {
                e.preventDefault();
                const href = dest.getAttribute('href');
                if (href) {
                    const section = href.substring(1);
                    this.navigateToSection(section);
                    this.updateActiveState(destinations, dest);
                }
            });
        });

        // Setup menu button for drawer
        const menuButton = rail.querySelector('.m3-navigation-rail__menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.openDrawer();
            });
        }
    }

    /**
     * Setup navigation drawer functionality
     */
    setupNavigationDrawer() {
        const drawer = document.querySelector('.m3-navigation-drawer');
        if (!drawer) return;

        const closeButton = drawer.querySelector('.m3-navigation-drawer__close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDrawer();
            });
        }

        const items = drawer.querySelectorAll('.m3-navigation-drawer__item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').substring(1);
                this.navigateToSection(section);
                this.updateActiveState(items, item);
                this.closeDrawer();
            });
        });

        // Close drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDrawerOpen && !drawer.contains(e.target)) {
                const menuButton = document.querySelector('.m3-navigation-rail__menu-button');
                if (!menuButton || !menuButton.contains(e.target)) {
                    this.closeDrawer();
                }
            }
        });
    }

    /**
     * Setup bottom navigation functionality
     */
    setupBottomNavigation() {
        const bottomNav = document.querySelector('.m3-bottom-navigation');
        if (!bottomNav) return;

        const items = bottomNav.querySelectorAll('.m3-bottom-navigation__item');

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href) {
                    const section = href.substring(1);
                    this.navigateToSection(section);
                    this.updateActiveState(items, item);
                }
            });
        });
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleResponsiveChange = (e) => {
            if (e.matches) {
                // Mobile: Show bottom navigation, hide rail
                this.showBottomNavigation();
                this.hideNavigationRail();
            } else {
                // Desktop: Show rail, hide bottom navigation
                this.showNavigationRail();
                this.hideBottomNavigation();
            }
        };

        mediaQuery.addEventListener('change', handleResponsiveChange);
        handleResponsiveChange(mediaQuery);
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Focus management
        this.setupFocusManagement();

        // ARIA attributes
        this.updateAriaAttributes();
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Close drawer with Escape
            if (e.key === 'Escape' && this.isDrawerOpen) {
                this.closeDrawer();
                return;
            }

            // Navigation with arrow keys
            if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                e.preventDefault();
                this.navigateWithKeyboard(e.key === 'ArrowRight' ? 1 : -1);
            }
        });
    }

    /**
     * Navigate to a specific section
     */
    navigateToSection(section) {
        this.currentSection = section;

        // Update URL without page refresh
        history.pushState({ section }, '', `#${section}`);

        // Load section content
        this.loadSectionContent(section);

        // Save current section
        this.saveCurrentSection();

        // Close drawer if open
        if (this.isDrawerOpen) {
            this.closeDrawer();
        }
    }

    /**
     * Update active state for navigation items
     */
    updateActiveState(items, activeItem) {
        items.forEach(item => {
            item.classList.remove(
                'm3-navigation-rail__destination--active',
                'm3-bottom-navigation__item--active',
                'm3-navigation-drawer__item--active'
            );
            item.removeAttribute('aria-current');
        });

        activeItem.classList.add(
            'm3-navigation-rail__destination--active',
            'm3-bottom-navigation__item--active',
            'm3-navigation-drawer__item--active'
        );
        activeItem.setAttribute('aria-current', 'page');
    }

    /**
     * Open navigation drawer
     */
    openDrawer() {
        const drawer = document.querySelector('.m3-navigation-drawer');
        if (!drawer) return;

        drawer.classList.add('m3-navigation-drawer--open');
        this.isDrawerOpen = true;

        // Focus management
        const firstFocusable = drawer.querySelector('button, a, [tabindex]');
        if (firstFocusable) {
            firstFocusable.focus();
        }

        // Update ARIA attributes
        this.updateAriaAttributes();
    }

    /**
     * Close navigation drawer
     */
    closeDrawer() {
        const drawer = document.querySelector('.m3-navigation-drawer');
        if (!drawer) return;

        drawer.classList.remove('m3-navigation-drawer--open');
        this.isDrawerOpen = false;

        // Update ARIA attributes
        this.updateAriaAttributes();
    }

    /**
     * Show navigation rail
     */
    showNavigationRail() {
        const rail = document.querySelector('.m3-navigation-rail');
        if (rail) {
            rail.classList.remove('m3-navigation-rail--hidden');
        }
    }

    /**
     * Hide navigation rail
     */
    hideNavigationRail() {
        const rail = document.querySelector('.m3-navigation-rail');
        if (rail) {
            rail.classList.add('m3-navigation-rail--hidden');
        }
    }

    /**
     * Show bottom navigation
     */
    showBottomNavigation() {
        const bottomNav = document.querySelector('.m3-bottom-navigation');
        if (bottomNav) {
            bottomNav.classList.remove('m3-bottom-navigation--hidden');
        }
    }

    /**
     * Hide bottom navigation
     */
    hideBottomNavigation() {
        const bottomNav = document.querySelector('.m3-bottom-navigation');
        if (bottomNav) {
            bottomNav.classList.add('m3-bottom-navigation--hidden');
        }
    }

    /**
     * Load section content
     */
    loadSectionContent(section) {
        // Hide loading indicator
        const loading = document.getElementById('content-loading');
        if (loading) {
            loading.style.display = 'none';
        }

        // Dispatch section change event
        const event = new CustomEvent('sectionchange', {
            detail: { section }
        });
        document.dispatchEvent(event);
    }

    /**
     * Navigate with keyboard
     */
    navigateWithKeyboard(direction) {
        const sections = ['home', 'hue', 'sonos', 'calendar', 'games'];
        const currentIndex = sections.indexOf(this.currentSection);
        const newIndex = (currentIndex + direction + sections.length) % sections.length;
        this.navigateToSection(sections[newIndex]);
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Focus trap for drawer
        const drawer = document.querySelector('.m3-navigation-drawer');
        if (drawer) {
            const focusableElements = drawer.querySelectorAll(
                'button, a, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                drawer.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                });
            }
        }
    }

    /**
     * Update ARIA attributes
     */
    updateAriaAttributes() {
        const drawer = document.querySelector('.m3-navigation-drawer');
        if (drawer) {
            drawer.setAttribute('aria-hidden', this.isDrawerOpen ? 'false' : 'true');
        }
    }

    /**
     * Save current section to localStorage
     */
    saveCurrentSection() {
        localStorage.setItem('m3-current-section', this.currentSection);
    }

    /**
     * Load saved section from localStorage
     */
    loadSavedSection() {
        const savedSection = localStorage.getItem('m3-current-section');
        if (savedSection && this.isValidSection(savedSection)) {
            this.navigateToSection(savedSection);
        }
    }

    /**
     * Check if section is valid
     */
    isValidSection(section) {
        const validSections = ['home', 'hue', 'sonos', 'calendar', 'games'];
        return validSections.includes(section);
    }

    /**
     * Get current section
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Check if drawer is open
     */
    isDrawerOpen() {
        return this.isDrawerOpen;
    }
}

// Initialize navigation manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.m3NavigationManager = new M3NavigationManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3NavigationManager;
}
