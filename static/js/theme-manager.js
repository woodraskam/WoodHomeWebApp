/**
 * Material Design 3 Theme Manager
 * Handles dynamic theming, light/dark mode switching, and theme persistence
 */
class M3ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.preferredTheme = null;
        this.systemTheme = 'light';
        this.init();
    }

    init() {
        this.detectSystemTheme();
        this.loadSavedTheme();
        this.applyTheme();
        this.setupThemeToggle();
        this.setupSystemThemeListener();
    }

    /**
     * Detect system theme preference
     */
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemTheme = 'dark';
        } else {
            this.systemTheme = 'light';
        }
    }

    /**
     * Load saved theme preference from localStorage
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('m3-theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            this.preferredTheme = savedTheme;
            this.currentTheme = savedTheme;
        } else {
            this.currentTheme = this.systemTheme;
        }
    }

    /**
     * Apply the current theme to the document
     */
    applyTheme() {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light-theme', 'dark-theme');
        root.removeAttribute('data-theme');

        // Apply current theme
        if (this.currentTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark-theme');
        } else {
            root.classList.add('light-theme');
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor();

        // Dispatch theme change event
        this.dispatchThemeChangeEvent();
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        if (this.currentTheme === 'dark') {
            metaThemeColor.content = '#141218'; // M3 dark surface color
        } else {
            metaThemeColor.content = '#FFFBFE'; // M3 light surface color
        }
    }

    /**
     * Set theme (light, dark, or auto)
     */
    setTheme(theme) {
        if (theme === 'auto') {
            this.preferredTheme = null;
            this.currentTheme = this.systemTheme;
        } else if (theme === 'light' || theme === 'dark') {
            this.preferredTheme = theme;
            this.currentTheme = theme;
        } else {
            console.warn('Invalid theme:', theme);
            return;
        }

        this.saveTheme();
        this.applyTheme();
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        if (this.currentTheme === 'light') {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme() {
        if (this.preferredTheme) {
            localStorage.setItem('m3-theme', this.preferredTheme);
        } else {
            localStorage.removeItem('m3-theme');
        }
    }

    /**
     * Setup theme toggle button (if it exists)
     */
    setupThemeToggle() {
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    /**
     * Listen for system theme changes
     */
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                this.systemTheme = e.matches ? 'dark' : 'light';

                // Only update if user hasn't set a preferred theme
                if (!this.preferredTheme) {
                    this.currentTheme = this.systemTheme;
                    this.applyTheme();
                }
            };

            mediaQuery.addEventListener('change', handleSystemThemeChange);
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark theme is active
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Check if light theme is active
     */
    isLightTheme() {
        return this.currentTheme === 'light';
    }

    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                isDark: this.isDarkTheme(),
                isLight: this.isLightTheme()
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Get theme-aware color value
     */
    getColorValue(cssVariable) {
        const root = document.documentElement;
        return getComputedStyle(root).getPropertyValue(cssVariable).trim();
    }

    /**
     * Check if high contrast mode is preferred
     */
    isHighContrastMode() {
        return window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches;
    }

    /**
     * Check if reduced motion is preferred
     */
    isReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Apply accessibility preferences
     */
    applyAccessibilityPreferences() {
        const root = document.documentElement;

        // High contrast mode
        if (this.isHighContrastMode()) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Reduced motion
        if (this.isReducedMotion()) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.m3ThemeManager = new M3ThemeManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3ThemeManager;
}
