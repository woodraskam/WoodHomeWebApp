/**
 * Unauthenticated Welcome Screen
 * Provides a welcoming experience for users who haven't authenticated yet
 */
class UnauthenticatedWelcome {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createWelcomeScreen();
        this.setupButtonHandlers();

        // Check initial authentication state
        this.checkInitialAuthState();
    }

    setupEventListeners() {
        // Listen for authentication state changes
        if (window.authenticationManager) {
            window.authenticationManager.addEventListener('authentication:changed', (e) => {
                console.log('UnauthenticatedWelcome: Authentication changed event received:', e.detail.authenticated);
                if (e.detail.authenticated) {
                    this.hide();
                } else {
                    this.show();
                }
            });
        } else {
            // Wait for AuthenticationManager to be available
            const checkAuthManager = () => {
                if (window.authenticationManager) {
                    window.authenticationManager.addEventListener('authentication:changed', (e) => {
                        console.log('UnauthenticatedWelcome: Authentication changed event received:', e.detail.authenticated);
                        if (e.detail.authenticated) {
                            this.hide();
                        } else {
                            this.show();
                        }
                    });
                } else {
                    setTimeout(checkAuthManager, 100);
                }
            };
            checkAuthManager();
        }

        // Listen for navigation changes to show/hide based on current section
        document.addEventListener('sectionchange', (e) => {
            this.handleSectionChange(e.detail.section);
        });

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const currentSection = window.location.hash.substring(1) || 'home';
            this.handleSectionChange(currentSection);
        });
    }

    handleSectionChange(section) {
        // Show welcome screen for authenticated services when user is not authenticated
        const authenticatedSections = ['hue', 'sonos', 'calendar'];
        if (authenticatedSections.includes(section)) {
            if (!this.isUserAuthenticated()) {
                this.show();
            } else {
                this.hide();
            }
        } else if (section === 'home') {
            // Always show welcome on home page if not authenticated
            if (!this.isUserAuthenticated()) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    isUserAuthenticated() {
        if (window.authenticationManager) {
            return window.authenticationManager.getAuthenticationState().isAuthenticated;
        }
        return false;
    }

    /**
     * Check initial authentication state
     */
    checkInitialAuthState() {
        // Wait a bit for AuthenticationManager to be ready
        setTimeout(() => {
            if (this.isUserAuthenticated()) {
                console.log('UnauthenticatedWelcome: User is already authenticated, hiding welcome screen');
                this.hide();
            } else {
                console.log('UnauthenticatedWelcome: User is not authenticated, showing welcome screen');
                this.show();
            }
        }, 100);
    }

    createWelcomeScreen() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const welcomeSection = document.createElement('div');
        welcomeSection.id = 'welcome-section';
        welcomeSection.className = 'm3-section welcome-section';
        welcomeSection.innerHTML = this.getWelcomeHTML();

        contentArea.appendChild(welcomeSection);
    }

    getWelcomeHTML() {
        return `
            <div class="welcome-container">
                <div class="welcome-hero">
                    <div class="welcome-icon">
                        <span class="material-symbols-outlined large">home</span>
                    </div>
                    <h1 class="welcome-title">Welcome to WoodHome</h1>
                    <p class="welcome-subtitle">Your smart home control center</p>
                </div>

                <div class="welcome-features">
                    <div class="welcome-feature">
                        <div class="welcome-feature-icon">
                            <span class="material-symbols-outlined">lightbulb</span>
                        </div>
                        <div class="welcome-feature-content">
                            <h3>Smart Lighting</h3>
                            <p>Control your Philips Hue lights with ease</p>
                        </div>
                    </div>

                    <div class="welcome-feature">
                        <div class="welcome-feature-icon">
                            <span class="material-symbols-outlined">music_note</span>
                        </div>
                        <div class="welcome-feature-content">
                            <h3>Audio Control</h3>
                            <p>Manage your Sonos speakers throughout your home</p>
                        </div>
                    </div>

                    <div class="welcome-feature">
                        <div class="welcome-feature-icon">
                            <span class="material-symbols-outlined">event</span>
                        </div>
                        <div class="welcome-feature-content">
                            <h3>Calendar Integration</h3>
                            <p>Sync with your Google Calendar for smart scheduling</p>
                        </div>
                    </div>
                </div>

                <div class="welcome-actions">
                    <button id="welcome-signin-btn" class="m3-button m3-button--primary welcome-signin">
                        <span class="material-symbols-outlined">login</span>
                        Sign in with Google
                    </button>
                    <p class="welcome-note">Sign in to access all features and personalize your experience</p>
                </div>

                <div class="welcome-footer">
                    <p class="welcome-footer-text">WoodHome Dashboard - Smart Home Control</p>
                </div>
            </div>
        `;
    }

    show() {
        if (this.isVisible) {
            console.log('UnauthenticatedWelcome: Welcome screen already visible');
            return;
        }

        // Hide any loading overlays that might be blocking the button
        const loadingOverlays = document.querySelectorAll('.m3-loading');
        loadingOverlays.forEach(overlay => {
            overlay.classList.add('hidden');
            console.log('UnauthenticatedWelcome: Hidden loading overlay');
        });

        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.classList.add('welcome-section--visible');
            this.isVisible = true;
            console.log('UnauthenticatedWelcome: Welcome screen shown');
        }
    }

    hide() {
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.classList.remove('welcome-section--visible');
            this.isVisible = false;
            console.log('UnauthenticatedWelcome: Welcome screen hidden');
        }
    }

    setupButtonHandlers() {
        // Wait for DOM to be ready
        setTimeout(() => {
            // Hide any loading overlays that might be blocking the button
            const loadingOverlays = document.querySelectorAll('.m3-loading');
            loadingOverlays.forEach(overlay => {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
                overlay.style.display = 'none';
                console.log('UnauthenticatedWelcome: Force hidden loading overlay');
            });

            const signinBtn = document.getElementById('welcome-signin-btn');
            if (signinBtn) {
                console.log('UnauthenticatedWelcome: Setting up signin button handler');

                // Ensure button is clickable and properly styled
                signinBtn.style.pointerEvents = 'auto';
                signinBtn.style.cursor = 'pointer';
                signinBtn.style.userSelect = 'none';
                signinBtn.style.display = 'inline-flex';
                signinBtn.style.alignItems = 'center';
                signinBtn.style.justifyContent = 'center';
                signinBtn.style.textDecoration = 'none';
                signinBtn.style.border = 'none';
                signinBtn.style.outline = 'none';
                signinBtn.style.position = 'relative';
                signinBtn.style.zIndex = '9999';

                // Remove any existing event listeners
                signinBtn.replaceWith(signinBtn.cloneNode(true));
                const newSigninBtn = document.getElementById('welcome-signin-btn');

                newSigninBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('UnauthenticatedWelcome: Signin button clicked');
                    this.authenticate();
                });

                // Also add mouse events for debugging
                newSigninBtn.addEventListener('mouseenter', () => {
                    console.log('UnauthenticatedWelcome: Button hover detected');
                });

                newSigninBtn.addEventListener('mousedown', () => {
                    console.log('UnauthenticatedWelcome: Button mousedown detected');
                });

                console.log('UnauthenticatedWelcome: Button handler setup complete');
            } else {
                console.warn('UnauthenticatedWelcome: Signin button not found');
            }
        }, 100);
    }

    authenticate() {
        console.log('UnauthenticatedWelcome: Initiating authentication');
        window.location.href = '/auth/google/login';
    }
}

// Initialize welcome screen
document.addEventListener('DOMContentLoaded', () => {
    window.unauthWelcome = new UnauthenticatedWelcome();
});

// Fallback initialization
if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
} else {
    // Document is already loaded, initialize immediately
    if (!window.unauthWelcome) {
        window.unauthWelcome = new UnauthenticatedWelcome();
    }
}
