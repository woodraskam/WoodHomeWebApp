/**
 * Home Dashboard Section
 * Main dashboard with system status overview and quick access widgets
 */
class HomeSection {
  constructor() {
    this.isLoaded = false;
    this.widgets = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createHomeSection();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for section load events
    document.addEventListener('sectionload', (e) => {
      if (e.detail.section === 'home') {
        this.load();
      }
    });

    // Listen for section change events
    document.addEventListener('sectionchange', (e) => {
      if (e.detail.section === 'home') {
        this.show();
      } else {
        this.hide();
      }
    });
  }

  /**
   * Create home section HTML
   */
  createHomeSection() {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    const homeSection = document.createElement('div');
    homeSection.id = 'home-section';
    homeSection.className = 'm3-section';
    homeSection.innerHTML = this.getHomeSectionHTML();

    contentArea.appendChild(homeSection);
  }

  /**
   * Get home section HTML
   */
  getHomeSectionHTML() {
    return `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Home Dashboard</h1>
          <p class="m3-section-subtitle">Welcome to your smart home control center</p>
        </div>
      </div>

      <div class="m3-dashboard-grid">
        <!-- System Status Widget -->
        <div class="m3-dashboard-widget" id="system-status-widget">
          <div class="m3-dashboard-widget__header">
            <h3 class="m3-dashboard-widget__title">System Status</h3>
            <svg class="m3-dashboard-widget__icon" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
            </svg>
          </div>
          <div class="m3-dashboard-widget__content">
            <div class="m3-status-indicator m3-status-indicator--online">
              <div class="m3-status-indicator__dot"></div>
              <span>All systems operational</span>
            </div>
            <div class="m3-quick-actions">
              <button class="m3-quick-action" onclick="homeSection.refreshSystemStatus()">
                <svg class="m3-icon" viewBox="0 0 24 24">
                  <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                </svg>
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        <!-- Sonos Status Widget -->
        <div class="m3-dashboard-widget" id="sonos-status-widget">
          <div class="m3-dashboard-widget__header">
            <h3 class="m3-dashboard-widget__title">Sonos Audio</h3>
            <svg class="m3-dashboard-widget__icon" viewBox="0 0 24 24">
              <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17S7.79,21 10,21 14,19.21 14,17V7H18V3H12Z"/>
            </svg>
          </div>
          <div class="m3-dashboard-widget__content">
            <div id="sonos-status-content">
              <p>No audio playing</p>
              <div class="m3-quick-actions">
                <button class="m3-quick-action" onclick="homeSection.navigateToSection('sonos')">
                  <svg class="m3-icon" viewBox="0 0 24 24">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                  </svg>
                  Open Sonos
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar Widget -->
        <div class="m3-dashboard-widget" id="calendar-widget">
          <div class="m3-dashboard-widget__header">
            <h3 class="m3-dashboard-widget__title">Upcoming Events</h3>
            <svg class="m3-dashboard-widget__icon" viewBox="0 0 24 24">
              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
            </svg>
          </div>
          <div class="m3-dashboard-widget__content">
            <div id="calendar-events-content">
              <p>No upcoming events</p>
              <div class="m3-quick-actions">
                <button class="m3-quick-action" onclick="homeSection.navigateToSection('calendar')">
                  <svg class="m3-icon" viewBox="0 0 24 24">
                    <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                  </svg>
                  View Calendar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Hue Lighting Widget -->
        <div class="m3-dashboard-widget" id="hue-widget">
          <div class="m3-dashboard-widget__header">
            <h3 class="m3-dashboard-widget__title">Hue Lighting</h3>
            <svg class="m3-dashboard-widget__icon" viewBox="0 0 24 24">
              <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
            </svg>
          </div>
          <div class="m3-dashboard-widget__content">
            <div id="hue-status-content">
              <p>Lighting status unavailable</p>
              <div class="m3-quick-actions">
                <button class="m3-quick-action" onclick="homeSection.navigateToSection('hue')">
                  <svg class="m3-icon" viewBox="0 0 24 24">
                    <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
                  </svg>
                  Control Lights
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Games Widget -->
        <div class="m3-dashboard-widget" id="games-widget">
          <div class="m3-dashboard-widget__header">
            <h3 class="m3-dashboard-widget__title">Games</h3>
            <svg class="m3-dashboard-widget__icon" viewBox="0 0 24 24">
              <path d="M21,6H3A2,2 0 0,0 1,8V16A2,2 0 0,0 3,18H21A2,2 0 0,0 23,16V8A2,2 0 0,0 21,6M21,16H3V8H21V16Z"/>
            </svg>
          </div>
          <div class="m3-dashboard-widget__content">
            <div class="m3-games-grid">
              <a href="/candyland" class="m3-game-card" target="_blank">
                <svg class="m3-game-card__icon" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                </svg>
                <h4 class="m3-game-card__title">Candy Land</h4>
                <p class="m3-game-card__description">Classic board game adventure</p>
              </a>
              
              <a href="/tictactoe" class="m3-game-card" target="_blank">
                <svg class="m3-game-card__icon" viewBox="0 0 24 24">
                  <path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H17V17H7V15Z"/>
                </svg>
                <h4 class="m3-game-card__title">Tic Tac Toe</h4>
                <p class="m3-game-card__description">Simple strategy game</p>
              </a>
            </div>
            <div class="m3-quick-actions">
              <button class="m3-quick-action" onclick="homeSection.navigateToSection('games')">
                <svg class="m3-icon" viewBox="0 0 24 24">
                  <path d="M21,6H3A2,2 0 0,0 1,8V16A2,2 0 0,0 3,18H21A2,2 0 0,0 23,16V8A2,2 0 0,0 21,6M21,16H3V8H21V16Z"/>
                </svg>
                View All Games
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Load home section
   */
  load() {
    if (!this.isLoaded) {
      this.loadWidgetData();
      this.isLoaded = true;
    }
    this.show();
  }

  /**
   * Show home section
   */
  show() {
    const section = document.getElementById('home-section');
    if (section) {
      section.classList.add('m3-section--active');
    }
  }

  /**
   * Hide home section
   */
  hide() {
    const section = document.getElementById('home-section');
    if (section) {
      section.classList.remove('m3-section--active');
    }
  }

  /**
   * Load widget data
   */
  loadWidgetData() {
    this.loadSystemStatus();
    this.loadSonosStatus();
    this.loadCalendarEvents();
    this.loadHueStatus();
  }

  /**
   * Load system status
   */
  loadSystemStatus() {
    // Simulate system status check
    setTimeout(() => {
      const statusWidget = document.getElementById('system-status-widget');
      if (statusWidget) {
        // Update status indicator
        const statusIndicator = statusWidget.querySelector('.m3-status-indicator');
        if (statusIndicator) {
          statusIndicator.className = 'm3-status-indicator m3-status-indicator--online';
          statusIndicator.innerHTML = `
            <div class="m3-status-indicator__dot"></div>
            <span>All systems operational</span>
          `;
        }
      }
    }, 500);
  }

  /**
   * Load Sonos status
   */
  loadSonosStatus() {
    // This would connect to Sonos API in real implementation
    const sonosContent = document.getElementById('sonos-status-content');
    if (sonosContent) {
      sonosContent.innerHTML = `
        <p>No audio playing</p>
        <div class="m3-quick-actions">
          <button class="m3-quick-action" onclick="homeSection.navigateToSection('sonos')">
            <svg class="m3-icon" viewBox="0 0 24 24">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            Open Sonos
          </button>
        </div>
      `;
    }
  }

  /**
   * Load calendar events
   */
  loadCalendarEvents() {
    // This would connect to Google Calendar API in real implementation
    const calendarContent = document.getElementById('calendar-events-content');
    if (calendarContent) {
      calendarContent.innerHTML = `
        <p>No upcoming events</p>
        <div class="m3-quick-actions">
          <button class="m3-quick-action" onclick="homeSection.navigateToSection('calendar')">
            <svg class="m3-icon" viewBox="0 0 24 24">
              <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
            </svg>
            View Calendar
          </button>
        </div>
      `;
    }
  }

  /**
   * Load Hue status
   */
  async loadHueStatus() {
    const hueContent = document.getElementById('hue-status-content');
    if (hueContent) {
      try {
        const response = await fetch('/api/hue/status');
        if (response.ok) {
          const status = await response.json();
          const bridge = status.bridge;
          const lightsInfo = status.lights;

          hueContent.innerHTML = `
                        <div class="m3-hue-status">
                            <div class="m3-hue-status-item">
                                <span class="material-symbols-outlined ${bridge?.is_online ? 'm3-status-online' : 'm3-status-offline'}">router</span>
                                <div>
                                    <p><strong>Bridge:</strong> ${bridge?.name || 'Unknown'} ${bridge?.is_online ? '(Online)' : '(Offline)'}</p>
                                    <p><strong>Lights:</strong> ${lightsInfo?.online || 0} online, ${lightsInfo?.offline || 0} offline</p>
                                </div>
                            </div>
                        </div>
                        <div class="m3-quick-actions">
                            <button class="m3-quick-action" onclick="homeSection.navigateToSection('hue')">
                                <span class="material-symbols-outlined">lightbulb</span>
                                Control Lights
                            </button>
                        </div>
                    `;
        } else {
          throw new Error('Failed to load Hue status');
        }
      } catch (error) {
        console.error('Failed to load Hue status:', error);
        hueContent.innerHTML = `
                    <p>Lighting status unavailable</p>
                    <div class="m3-quick-actions">
                        <button class="m3-quick-action" onclick="homeSection.navigateToSection('hue')">
                            <span class="material-symbols-outlined">lightbulb</span>
                            Control Lights
                        </button>
                    </div>
                `;
      }
    }
  }

  /**
   * Refresh system status
   */
  refreshSystemStatus() {
    this.loadSystemStatus();
  }

  /**
   * Navigate to section
   */
  navigateToSection(section) {
    if (window.spaRouter) {
      window.spaRouter.navigateToSection(section);
    }
  }
}

// Initialize home section when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.homeSection = new HomeSection();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HomeSection;
}
