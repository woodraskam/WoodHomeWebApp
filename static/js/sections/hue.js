/**
 * Hue Lighting Section
 * Material Design 3 compliant Hue lighting controls
 */
class HueSection extends AuthenticatedSection {
    constructor() {
        super();
        console.log('HueSection: Constructor called');
        this.lights = [];
        this.rooms = [];
        this.scenes = [];
        this.bridge = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createHueSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            console.log('HueSection: sectionload event received:', e.detail);
            if (e.detail.section === 'hue') {
                console.log('HueSection: sectionload event for hue, calling load() and show()');
                this.load();
                this.show();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            console.log('HueSection: sectionchange event received:', e.detail);
            if (e.detail.section === 'hue') {
                console.log('HueSection: sectionchange event for hue, calling load() and show()');
                this.load();
                this.show();
            } else {
                this.hide();
            }
        });

        // Also listen for hash changes in case the router doesn't dispatch events
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            console.log('HueSection: hashchange event, hash:', hash);
            if (hash === '#hue') {
                console.log('HueSection: hashchange to hue, calling load() and show()');
                this.load();
                this.show();
            } else {
                this.hide();
            }
        });
    }

    createHueSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) {
            console.error('HueSection: main-content element not found');
            return;
        }
        console.log('HueSection: Creating Hue section');

        const hueSection = document.createElement('div');
        hueSection.id = 'hue-section';
        hueSection.className = 'm3-section';
        hueSection.innerHTML = `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Hue Lighting</h1>
          <p class="m3-section-subtitle">Control your Philips Hue lights</p>
        </div>
              <div class="m3-section-actions">
                <button class="m3-button m3-button--icon" id="hue-info-btn" title="System Status">
                  <span class="material-symbols-outlined">info</span>
                </button>
                <button class="m3-button m3-button--icon" id="hue-refresh-btn" title="Refresh">
                  <span class="material-symbols-outlined">refresh</span>
                </button>
              </div>
      </div>
      
      <!-- Configuration Card -->
      <div class="m3-card" id="hue-config-card">
        <div class="m3-card-header">
          <h3 class="m3-card-title">Configuration</h3>
        </div>
        <div class="m3-card-content" id="hue-config-content">
          <div class="m3-loading">
            <div class="m3-circular-progress"></div>
            <p>Checking Hue configuration...</p>
          </div>
        </div>
      </div>
      

      <!-- Rooms Section -->
      <div class="m3-card" id="hue-rooms-card">
        <div class="m3-card-header">
          <h3 class="m3-card-title">Rooms</h3>
        </div>
        <div class="m3-card-content" id="hue-rooms-content">
          <div class="m3-loading">
            <div class="m3-circular-progress"></div>
            <p>Loading rooms...</p>
          </div>
        </div>
      </div>

      <!-- Scenes Section -->
      <div class="m3-card" id="hue-scenes-card">
        <div class="m3-card-header">
          <h3 class="m3-card-title">Scenes</h3>
        </div>
        <div class="m3-card-content" id="hue-scenes-content">
          <div class="m3-loading">
            <div class="m3-circular-progress"></div>
            <p>Loading scenes...</p>
          </div>
        </div>
      </div>

      <!-- Individual Lights Section -->
      <div class="m3-card" id="hue-lights-card">
        <div class="m3-card-header">
          <h3 class="m3-card-title">Individual Lights</h3>
        </div>
        <div class="m3-card-content" id="hue-lights-content">
          <div class="m3-loading">
            <div class="m3-circular-progress"></div>
            <p>Loading lights...</p>
          </div>
        </div>
      </div>
    `;

        contentArea.appendChild(hueSection);

        // Add Material Design 3 popup dialog
        this.createStatusPopup();
        this.setupHueEventListeners();
    }

    createStatusPopup() {
        // Create Material Design 3 popup dialog
        const popup = document.createElement('div');
        popup.id = 'hue-status-popup';
        popup.className = 'm3-dialog';
        popup.innerHTML = `
            <div class="m3-dialog-backdrop"></div>
            <div class="m3-dialog-container">
                <div class="m3-dialog-surface">
                    <div class="m3-dialog-header">
                        <h2 class="m3-dialog-title">Hue System Status</h2>
                        <button class="m3-button m3-button--icon m3-dialog-close" id="hue-popup-close">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="m3-dialog-content" id="hue-popup-content">
                        <div class="m3-loading">
                            <div class="m3-circular-progress"></div>
                            <p>Loading system status...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
    }

    setupHueEventListeners() {
        // Info button
        const infoBtn = document.getElementById('hue-info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => {
                this.showStatusPopup();
            });
        }

        // Popup close button
        const closeBtn = document.getElementById('hue-popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideStatusPopup();
            });
        }

        // Popup backdrop click
        const backdrop = document.querySelector('#hue-status-popup .m3-dialog-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.hideStatusPopup();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('hue-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    /**
     * Override base class initialize method
     */
    initialize() {
        console.log('HueSection: Initialize called (authentication required)');
        // Only initialize if authenticated
        if (this.isAuthenticated()) {
            this.setupHueEventListeners();
            this.loadData();
        } else {
            this.showAuthenticationRequired();
        }
    }

    /**
     * Override base class show method
     */
    show() {
        console.log('HueSection: Show called');
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    /**
     * Override base class hide method
     */
    hide() {
        console.log('HueSection: Hide called');
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }

    /**
     * Override base class cleanup method
     */
    cleanup() {
        console.log('HueSection: Cleanup called');
        // Stop any ongoing operations
        this.isLoading = false;
        // Clear data if needed
        this.lights = [];
        this.rooms = [];
        this.scenes = [];
    }

    /**
     * Override base class showAuthenticationRequired method
     */
    showAuthenticationRequired() {
        console.log('HueSection: Authentication required');
        // Show authentication prompt or redirect to login
        const section = document.getElementById('hue-section');
        if (section) {
            section.innerHTML = `
                <div class="m3-card">
                    <div class="m3-card__content">
                        <div class="m3-calendar-auth">
                            <div class="m3-calendar-auth__icon">
                                <span class="material-symbols-outlined">lightbulb</span>
                            </div>
                            <div class="m3-calendar-auth__content">
                                <h3 class="m3-calendar-auth__title">Connect to Hue Lighting</h3>
                                <p class="m3-calendar-auth__description">
                                    Please authenticate to access your Hue lighting controls.
                                </p>
                                <button class="m3-button m3-button--primary" onclick="window.location.href='/auth/google/login'">
                                    <span class="material-symbols-outlined">login</span>
                                    Sign in with Google
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async load() {
        console.log('HueSection: load() called');

        // Ensure section exists
        if (!document.getElementById('hue-section')) {
            console.log('HueSection: Section not found, creating it');
            this.createHueSection();
        }

        if (!this.isLoaded) {
            console.log('HueSection: First time loading, calling loadData()');
            this.isLoaded = true;
            await this.loadData();
        }
        console.log('HueSection: Showing section');
        this.show();
    }

    async loadData() {
        console.log('HueSection: loadData() called');
        if (this.isLoading) {
            console.log('HueSection: Already loading, skipping');
            return;
        }
        this.isLoading = true;
        console.log('HueSection: Starting parallel data loading...');

        try {
            await Promise.all([
                this.loadConfiguration(),
                this.loadRooms(),
                this.loadScenes(),
                this.loadLights()
            ]);
            console.log('HueSection: All data loaded successfully');
        } catch (error) {
            console.error('Failed to load Hue data:', error);
            this.showError('Failed to load Hue system data');
        } finally {
            this.isLoading = false;
            console.log('HueSection: Data loading completed');
        }
    }

    async refreshData() {
        const refreshBtn = document.getElementById('hue-refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('m3-button--loading');
        }

        await this.loadData();

        if (refreshBtn) {
            refreshBtn.classList.remove('m3-button--loading');
        }
    }

    async loadConfiguration() {
        console.log('HueSection: loadConfiguration() called');
        try {
            console.log('HueSection: Fetching /api/hue/status...');
            const response = await fetch('/api/hue/status');
            console.log('HueSection: Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const status = await response.json();
            console.log('HueSection: Configuration data received:', status);
            this.updateConfiguration(status);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.updateConfiguration({
                error: error.message
            });
        }
    }

    async loadSystemStatus() {
        console.log('HueSection: loadSystemStatus() called');
        try {
            console.log('HueSection: Fetching /api/hue/status for system status...');
            const response = await fetch('/api/hue/status');
            console.log('HueSection: System status response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const status = await response.json();
            console.log('HueSection: System status data received:', status);
            this.updateSystemStatus(status);
        } catch (error) {
            console.error('Failed to load system status:', error);
            this.showError('Failed to load system status', 'hue-popup-content');
        }
    }

    async loadRooms() {
        try {
            const response = await fetch('/api/hue/rooms');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.rooms = await response.json();
            this.updateRoomsDisplay();
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.showError('Failed to load rooms', 'hue-rooms-content');
        }
    }

    async loadScenes() {
        try {
            const response = await fetch('/api/hue/scenes');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.scenes = await response.json();
            this.updateScenesDisplay();
        } catch (error) {
            console.error('Failed to load scenes:', error);
            this.showError('Failed to load scenes', 'hue-scenes-content');
        }
    }

    async loadLights() {
        try {
            const response = await fetch('/api/hue/lights');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            this.lights = await response.json();
            this.updateLightsDisplay();
        } catch (error) {
            console.error('Failed to load lights:', error);
            this.showError('Failed to load lights', 'hue-lights-content');
        }
    }

    updateConfiguration(status) {
        const content = document.getElementById('hue-config-content');
        if (!content) return;

        if (status.error) {
            content.innerHTML = `
                <div class="m3-error-state">
                    <span class="material-symbols-outlined">error</span>
                    <p>Hue system error: ${status.error}</p>
                </div>
            `;
            return;
        }

        const bridge = status.bridge;
        if (bridge && bridge.is_online) {
            content.innerHTML = `
                <div class="m3-config-success">
                    <div class="m3-config-status">
                        <span class="material-symbols-outlined m3-status-online">check_circle</span>
                        <div class="m3-config-info">
                            <h4>Hue Bridge Connected</h4>
                            <p>Successfully connected to Hue bridge</p>
                            <p><strong>Bridge:</strong> ${bridge.name || 'Unknown'} (${bridge.ip || 'Unknown'})</p>
                            <p><strong>Version:</strong> ${bridge.sw_version || 'Unknown'}</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="m3-config-required">
                    <div class="m3-config-status">
                        <span class="material-symbols-outlined m3-status-offline">router</span>
                        <div class="m3-config-info">
                            <h4>Hue Bridge Not Configured</h4>
                            <p>Configure Hue bridge connection to control lights</p>
                        </div>
                    </div>
                    <div class="m3-config-instructions">
                        <h5>Configuration Instructions:</h5>
                        <ol>
                            <li>Find your Hue bridge IP address on your network</li>
                            <li>Press the link button on your Hue bridge</li>
                            <li>Set environment variables:</li>
                        </ol>
                        <div class="m3-code-block">
                            <code>HUE_BRIDGE_IP=192.168.1.100</code><br>
                            <code>HUE_USERNAME=your-generated-username</code>
                        </div>
                        <p><strong>Note:</strong> Authentication is handled offline for security. Configure these environment variables and restart the application.</p>
                    </div>
                </div>
            `;
        }
    }

    updateSystemStatus(status) {
        console.log('HueSection: updateSystemStatus() called with:', status);
        const content = document.getElementById('hue-popup-content');
        if (!content) {
            console.error('HueSection: hue-popup-content element not found');
            return;
        }

        if (status.error) {
            content.innerHTML = `
                <div class="m3-error-state">
                    <span class="material-symbols-outlined">error</span>
                    <p>Hue system unavailable: ${status.error}</p>
                    <button class="m3-button m3-button--filled" onclick="hueSection.refreshData()">
                        <span class="material-symbols-outlined">refresh</span>
                        Retry
                    </button>
                </div>
            `;
            return;
        }

        const bridge = status.bridge;
        const lightsInfo = status.lights;
        const roomsInfo = status.rooms;
        const scenesInfo = status.scenes;

        content.innerHTML = `
            <div class="m3-status-grid">
                <div class="m3-status-item">
                    <div class="m3-status-icon ${bridge?.is_online ? 'm3-status-icon--success' : 'm3-status-icon--error'}">
                        <span class="material-symbols-outlined">router</span>
                    </div>
                    <div class="m3-status-content">
                        <h4>Bridge</h4>
                        <p>${bridge?.name || 'Unknown'} ${bridge?.is_online ? '(Online)' : '(Offline)'}</p>
                    </div>
                </div>
                
                <div class="m3-status-item">
                    <div class="m3-status-icon m3-status-icon--info">
                        <span class="material-symbols-outlined">lightbulb</span>
                    </div>
                    <div class="m3-status-content">
                        <h4>Lights</h4>
                        <p>${lightsInfo?.online || 0} online, ${lightsInfo?.offline || 0} offline</p>
                    </div>
                </div>
                
                <div class="m3-status-item">
                    <div class="m3-status-icon m3-status-icon--info">
                        <span class="material-symbols-outlined">room</span>
                    </div>
                    <div class="m3-status-content">
                        <h4>Rooms</h4>
                        <p>${roomsInfo?.total || 0} rooms configured</p>
                    </div>
                </div>
                
                <div class="m3-status-item">
                    <div class="m3-status-icon m3-status-icon--info">
                        <span class="material-symbols-outlined">palette</span>
                    </div>
                    <div class="m3-status-content">
                        <h4>Scenes</h4>
                        <p>${scenesInfo?.total || 0} scenes available</p>
                    </div>
                </div>
            </div>
        `;
    }

    updateRoomsDisplay() {
        const content = document.getElementById('hue-rooms-content');
        if (!content) return;

        if (this.rooms.length === 0) {
            content.innerHTML = `
                <div class="m3-empty-state">
                    <span class="material-symbols-outlined">room</span>
                    <p>No rooms found</p>
                </div>
            `;
            return;
        }

        const roomsHTML = this.rooms.map(room => `
            <div class="m3-room-card" data-room-id="${room.id}">
                <div class="m3-room-header">
                    <div class="m3-room-info">
                        <h4 class="m3-room-name">${room.name}</h4>
                        <p class="m3-room-type">${room.class || 'Room'}</p>
                    </div>
                    <div class="m3-room-controls">
                        <button class="m3-switch ${room.is_on ? 'm3-switch--on' : ''}" 
                                data-room-id="${room.id}" 
                                onclick="hueSection.toggleRoom('${room.id}')">
                            <div class="m3-switch-track">
                                <div class="m3-switch-thumb"></div>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div class="m3-room-content">
                    <div class="m3-room-lights">
                        <p>${room.lights?.length || 0} lights</p>
                    </div>
                    
                    ${room.is_on ? `
                        <div class="m3-room-controls-expanded">
                            <div class="m3-brightness-control">
                                <label>Brightness</label>
                                <div class="m3-slider-container">
                                    <input type="range" 
                                           class="m3-slider" 
                                           min="0" 
                                           max="254" 
                                           value="${room.brightness || 0}"
                                           data-room-id="${room.id}"
                                           onchange="hueSection.setRoomBrightness('${room.id}', this.value)">
                                    <span class="m3-slider-value">${Math.round((room.brightness || 0) / 254 * 100)}%</span>
                                </div>
                            </div>
                            
                            <div class="m3-color-controls">
                                <button class="m3-button m3-button--outlined" 
                                        onclick="hueSection.showColorPicker('${room.id}')">
                                    <span class="material-symbols-outlined">palette</span>
                                    Color
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="m3-rooms-grid">
                ${roomsHTML}
            </div>
        `;
    }

    updateScenesDisplay() {
        const content = document.getElementById('hue-scenes-content');
        if (!content) return;

        if (this.scenes.length === 0) {
            content.innerHTML = `
                <div class="m3-empty-state">
                    <span class="material-symbols-outlined">palette</span>
                    <p>No scenes found</p>
                </div>
            `;
            return;
        }

        const scenesHTML = this.scenes.map(scene => `
            <div class="m3-scene-chip" data-scene-id="${scene.id}">
                <button class="m3-chip m3-chip--action" 
                        onclick="hueSection.activateScene('${scene.id}')">
                    <span class="material-symbols-outlined">palette</span>
                    <span class="m3-chip-label">${scene.name}</span>
                </button>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="m3-scenes-container">
                ${scenesHTML}
            </div>
        `;
    }

    updateLightsDisplay() {
        const content = document.getElementById('hue-lights-content');
        if (!content) return;

        if (this.lights.length === 0) {
            content.innerHTML = `
                <div class="m3-empty-state">
                    <span class="material-symbols-outlined">lightbulb</span>
                    <p>No lights found</p>
                </div>
            `;
            return;
        }

        const lightsHTML = this.lights.map(light => `
            <div class="m3-light-card" data-light-id="${light.id}">
                <div class="m3-light-header">
                    <div class="m3-light-info">
                        <h4 class="m3-light-name">${light.name}</h4>
                        <p class="m3-light-type">${light.type} ${light.reachable ? '(Online)' : '(Offline)'}</p>
                    </div>
                    <div class="m3-light-controls">
                        <button class="m3-switch ${light.on ? 'm3-switch--on' : ''}" 
                                data-light-id="${light.id}" 
                                onclick="hueSection.toggleLight('${light.id}')"
                                ${!light.reachable ? 'disabled' : ''}>
                            <div class="m3-switch-track">
                                <div class="m3-switch-thumb"></div>
                            </div>
                        </button>
                    </div>
                </div>
                
                <div class="m3-light-content">
                    ${light.on && light.reachable ? `
                        <div class="m3-light-controls-expanded">
                            <div class="m3-brightness-control">
                                <label>Brightness</label>
                                <div class="m3-slider-container">
                                    <input type="range" 
                                           class="m3-slider" 
                                           min="0" 
                                           max="254" 
                                           value="${light.bri || 0}"
                                           data-light-id="${light.id}"
                                           onchange="hueSection.setLightBrightness('${light.id}', this.value)">
                                    <span class="m3-slider-value">${Math.round((light.bri || 0) / 254 * 100)}%</span>
                                </div>
                            </div>
                            
                            <div class="m3-color-controls">
                                <button class="m3-button m3-button--outlined" 
                                        onclick="hueSection.showColorPicker('${light.id}')">
                                    <span class="material-symbols-outlined">palette</span>
                                    Color
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        content.innerHTML = `
            <div class="m3-lights-grid">
                ${lightsHTML}
            </div>
        `;
    }

    async toggleLight(lightId) {
        try {
            const response = await fetch(`/api/hue/lights/${lightId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            this.updateLightState(lightId, result.on);
        } catch (error) {
            console.error('Failed to toggle light:', error);
            this.showError('Failed to toggle light');
        }
    }

    async toggleRoom(roomId) {
        try {
            const response = await fetch(`/api/hue/groups/${roomId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            this.updateRoomState(roomId, result.on);
        } catch (error) {
            console.error('Failed to toggle room:', error);
            this.showError('Failed to toggle room');
        }
    }

    async setLightBrightness(lightId, brightness) {
        try {
            const response = await fetch(`/api/hue/lights/${lightId}/brightness?brightness=${brightness}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Update UI immediately
            this.updateLightBrightness(lightId, parseInt(brightness));
        } catch (error) {
            console.error('Failed to set light brightness:', error);
            this.showError('Failed to set brightness');
        }
    }

    async setRoomBrightness(roomId, brightness) {
        try {
            const response = await fetch(`/api/hue/groups/${roomId}/brightness?brightness=${brightness}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Update UI immediately
            this.updateRoomBrightness(roomId, parseInt(brightness));
        } catch (error) {
            console.error('Failed to set room brightness:', error);
            this.showError('Failed to set brightness');
        }
    }

    async activateScene(sceneId) {
        try {
            const response = await fetch(`/api/hue/scenes/${sceneId}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Refresh data to show updated states
            await this.refreshData();
        } catch (error) {
            console.error('Failed to activate scene:', error);
            this.showError('Failed to activate scene');
        }
    }

    showColorPicker(targetId) {
        // This would open a color picker modal
        // For now, just show a placeholder
        alert(`Color picker for ${targetId} - This would open a Material Design 3 color picker modal`);
    }

    // Authentication methods removed for security
    // Hue authentication is now handled offline via environment variables

    updateLightState(lightId, isOn) {
        const lightCard = document.querySelector(`[data-light-id="${lightId}"]`);
        if (lightCard) {
            const switchEl = lightCard.querySelector('.m3-switch');
            if (switchEl) {
                switchEl.classList.toggle('m3-switch--on', isOn);
            }
        }
    }

    updateRoomState(roomId, isOn) {
        // Update room data in memory
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            room.is_on = isOn;
        }

        // Update visual toggle
        const roomCard = document.querySelector(`[data-room-id="${roomId}"]`);
        if (roomCard) {
            const switchEl = roomCard.querySelector('.m3-switch');
            if (switchEl) {
                switchEl.classList.toggle('m3-switch--on', isOn);
            }

            // Update expanded controls visibility
            const expandedControls = roomCard.querySelector('.m3-room-controls-expanded');
            if (expandedControls) {
                expandedControls.style.display = isOn ? 'block' : 'none';
            }
        }
    }

    updateLightBrightness(lightId, brightness) {
        const lightCard = document.querySelector(`[data-light-id="${lightId}"]`);
        if (lightCard) {
            const slider = lightCard.querySelector('.m3-slider');
            const valueSpan = lightCard.querySelector('.m3-slider-value');
            if (slider) {
                slider.value = brightness;
            }
            if (valueSpan) {
                valueSpan.textContent = `${Math.round(brightness / 254 * 100)}%`;
            }
        }
    }

    updateRoomBrightness(roomId, brightness) {
        const roomCard = document.querySelector(`[data-room-id="${roomId}"]`);
        if (roomCard) {
            const slider = roomCard.querySelector('.m3-slider');
            const valueSpan = roomCard.querySelector('.m3-slider-value');
            if (slider) {
                slider.value = brightness;
            }
            if (valueSpan) {
                valueSpan.textContent = `${Math.round(brightness / 254 * 100)}%`;
            }
        }
    }

    showError(message, targetId = null) {
        const content = document.getElementById(targetId || 'hue-status-content');
        if (content) {
            content.innerHTML = `
                <div class="m3-error-state">
                    <span class="material-symbols-outlined">error</span>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    async showStatusPopup() {
        const popup = document.getElementById('hue-status-popup');
        if (popup) {
            popup.style.display = 'flex';
            await this.loadSystemStatus();
        }
    }

    hideStatusPopup() {
        const popup = document.getElementById('hue-status-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }

    show() {
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }
}

// Initialize Hue section with authentication awareness
document.addEventListener('DOMContentLoaded', () => {
    console.log('HueSection: DOMContentLoaded event fired');
    // Create instance - it will register with AuthenticationManager
    window.hueSection = new HueSection();
    console.log('HueSection: Global hueSection created:', window.hueSection);
});

// Fallback initialization for when the page is already loaded
if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
} else {
    // Document is already loaded, initialize immediately
    console.log('HueSection: Document already loaded, initializing immediately');
    if (!window.hueSection) {
        window.hueSection = new HueSection();
        console.log('HueSection: Global hueSection created (fallback):', window.hueSection);
    }
}
