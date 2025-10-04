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
                    <button class="m3-button m3-button--primary welcome-signin" onclick="window.location.href='/auth/google/login'">
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
