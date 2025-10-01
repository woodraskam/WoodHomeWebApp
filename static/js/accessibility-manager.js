/**
 * Accessibility Manager
 * Provides enhanced accessibility features for Material Design 3 components
 */

class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
        this.setupHighContrastMode();
        this.setupReducedMotion();
    }

    /**
     * Setup keyboard navigation for all interactive elements
     */
    setupKeyboardNavigation() {
        // Add keyboard navigation to all buttons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('md3-btn') || target.classList.contains('md3-chip')) {
                    e.preventDefault();
                    target.click();
                }
            }
        });

        // Add arrow key navigation for lists
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const listItems = document.querySelectorAll('.md3-list-item');
                const currentIndex = Array.from(listItems).indexOf(document.activeElement);
                
                if (currentIndex !== -1) {
                    e.preventDefault();
                    const nextIndex = e.key === 'ArrowDown' 
                        ? Math.min(currentIndex + 1, listItems.length - 1)
                        : Math.max(currentIndex - 1, 0);
                    
                    listItems[nextIndex]?.focus();
                }
            }
        });
    }

    /**
     * Setup focus management for modals and dialogs
     */
    setupFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.md3-dialog-overlay.open');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });

        // Focus trap for dialogs
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const dialog = document.querySelector('.md3-dialog-overlay.open .md3-dialog');
                if (dialog) {
                    this.trapFocus(e, dialog);
                }
            }
        });
    }

    /**
     * Trap focus within a dialog
     */
    trapFocus(e, dialog) {
        const focusableElements = dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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

    /**
     * Close modal and restore focus
     */
    closeModal(modal) {
        modal.classList.remove('open');
        const trigger = document.querySelector(`[data-target="${modal.id}"]`);
        trigger?.focus();
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add ARIA labels to interactive elements
        this.addAriaLabels();
        
        // Setup live regions for dynamic content
        this.setupLiveRegions();
        
        // Add role attributes where needed
        this.addRoleAttributes();
    }

    /**
     * Add ARIA labels to interactive elements
     */
    addAriaLabels() {
        // Add labels to buttons without text
        document.querySelectorAll('.md3-btn:not([aria-label])').forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && !btn.textContent.trim()) {
                const iconName = icon.textContent;
                btn.setAttribute('aria-label', this.getIconDescription(iconName));
            }
        });

        // Add labels to cards
        document.querySelectorAll('.md3-card').forEach(card => {
            const title = card.querySelector('.md3-card-title');
            if (title && !card.getAttribute('aria-labelledby')) {
                const titleId = title.id || `title-${Math.random().toString(36).substr(2, 9)}`;
                title.id = titleId;
                card.setAttribute('aria-labelledby', titleId);
            }
        });
    }

    /**
     * Get description for icon
     */
    getIconDescription(iconName) {
        const descriptions = {
            'home': 'Home',
            'menu': 'Menu',
            'close': 'Close',
            'settings': 'Settings',
            'refresh': 'Refresh',
            'play_arrow': 'Play',
            'pause': 'Pause',
            'stop': 'Stop',
            'wifi': 'WiFi',
            'wifi_off': 'WiFi Off',
            'location_on': 'Location',
            'music_note': 'Music',
            'speaker': 'Speaker',
            'volume_up': 'Volume Up',
            'volume_off': 'Volume Off'
        };
        return descriptions[iconName] || iconName;
    }

    /**
     * Setup live regions for announcements
     */
    setupLiveRegions() {
        // Create live region for status updates
        if (!document.getElementById('live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
    }

    /**
     * Announce message to screen readers
     */
    announce(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    /**
     * Add role attributes
     */
    addRoleAttributes() {
        // Add role to navigation
        document.querySelectorAll('.md3-navigation-drawer').forEach(nav => {
            nav.setAttribute('role', 'navigation');
        });

        // Add role to dialogs
        document.querySelectorAll('.md3-dialog').forEach(dialog => {
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
        });

        // Add role to lists
        document.querySelectorAll('.md3-list').forEach(list => {
            list.setAttribute('role', 'list');
        });

        document.querySelectorAll('.md3-list-item').forEach(item => {
            item.setAttribute('role', 'listitem');
        });
    }

    /**
     * Setup high contrast mode support
     */
    setupHighContrastMode() {
        // Check for high contrast mode preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Listen for changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        });
    }

    /**
     * Setup reduced motion support
     */
    setupReducedMotion() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }

    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        // Add required indicators
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && !label.querySelector('.required-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'required-indicator';
                indicator.textContent = ' *';
                indicator.setAttribute('aria-label', 'required');
                label.appendChild(indicator);
            }
        });

        // Add error states
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('invalid', () => {
                field.setAttribute('aria-invalid', 'true');
                this.announce(`${field.name || field.id} is required`);
            });

            field.addEventListener('input', () => {
                if (field.checkValidity()) {
                    field.removeAttribute('aria-invalid');
                }
            });
        });
    }
}

// Initialize accessibility manager
const accessibilityManager = new AccessibilityManager();

// Export for use in other scripts
window.AccessibilityManager = AccessibilityManager;
window.accessibilityManager = accessibilityManager;
