/**
 * Sonos Audio Section - SPA Compatible
 * Full Sonos integration with WebSocket support
 */
class SonosSection extends AuthenticatedSection {
    constructor() {
        super();
        this.name = 'sonos';
        this.devices = [];
        this.groups = [];
        this.websocket = null;
        this.isConnected = false;
        this.sectionCreated = false;

        // Initialize immediately
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('sectionchange', (e) => {
            console.log('SonosSection: sectionchange event received:', e.detail);
            if (e.detail.section === 'sonos') {
                this.showSection();
            } else {
                this.hideSection();
            }
        });

        // Also listen for hash changes in case the router doesn't dispatch events
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            console.log('SonosSection: hashchange event, hash:', hash);
            if (hash === '#sonos') {
                this.showSection();
            } else {
                this.hideSection();
            }
        });
    }

    showSection() {
        console.log('SonosSection: showSection() called');

        // Create section if it doesn't exist
        if (!this.sectionCreated) {
            this.createSonosSection();
            this.sectionCreated = true;
        }

        // Show the section with dissolve transition
        const section = document.getElementById('sonos-section');
        if (section) {
            section.style.display = 'block';
            section.classList.add('m3-section--transitioning');

            // Trigger dissolve in animation
            requestAnimationFrame(() => {
                section.classList.remove('m3-section--transitioning');
                section.classList.add('m3-section--active');
                console.log('SonosSection: Section shown with dissolve transition');
            });
        }

        // Load data and connect WebSocket
        this.loadData();
        this.connectWebSocket();
    }

    hideSection() {
        console.log('SonosSection: hideSection() called');

        // Hide the section with dissolve transition
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.remove('m3-section--active');
            section.classList.add('m3-section--transitioning');

            // Wait for transition to complete before hiding
            setTimeout(() => {
                section.style.display = 'none';
                section.classList.remove('m3-section--transitioning');
                console.log('SonosSection: Section hidden with dissolve transition');
            }, 300); // Match the CSS transition duration
        }

        // Disconnect WebSocket
        this.disconnectWebSocket();
    }

    createSonosSection() {
        console.log('SonosSection: createSonosSection() called');
        const contentArea = document.getElementById('main-content');
        if (!contentArea) {
            console.error('Main content area not found!');
            return;
        }

        const sonosSection = document.createElement('div');
        sonosSection.id = 'sonos-section';
        sonosSection.className = 'm3-section';
        sonosSection.innerHTML = `
            <div class="m3-section-header">
                <div class="sonos-header">
                    <div class="sonos-title">
                        <span class="material-symbols-outlined large interactive">music_note</span>
                        <h1 class="m3-section-title">Sonos Control</h1>
                </div>
                    <div class="sonos-status">
                        <span id="sonos-connection-status" class="status-indicator offline">Offline</span>
                        <span id="sonos-device-count" class="device-count">0 devices</span>
                        <button id="refresh-devices" class="md3-btn md3-btn-text">
                            <span class="material-symbols-outlined">refresh</span>
                            Refresh
                        </button>
                    </div>
                        </div>
                    </div>
            <div class="m3-section-content">
                <div id="sonos-content" class="sonos-content">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading Sonos devices...</p>
                    </div>
                </div>
            </div>
        `;
        sonosSection.style.display = 'none'; // Start hidden

        contentArea.appendChild(sonosSection);
        this.setupSonosEventListeners();
    }

    setupSonosEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-devices');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('SonosSection: Refresh button clicked');
                this.loadData();
            });
        }
    }

    async loadData() {
        console.log('SonosSection: loadData() called');
        try {
            await this.loadDevices();
            await this.loadGroups();
            this.renderUnifiedView();
        } catch (error) {
            console.error('SonosSection: Error loading data:', error);
        }
    }

    async loadDevices() {
        console.log('SonosSection: Loading devices...');
        try {
            const response = await fetch('/api/sonos/devices');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.devices = data.devices || [];
            console.log('SonosSection: Loaded devices:', this.devices.length);
        } catch (error) {
            console.error('SonosSection: Failed to load devices:', error);
            this.devices = [];
        }
    }

    async loadGroups() {
        console.log('SonosSection: Loading groups...');
        try {
            const response = await fetch('/api/sonos/groups');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.groups = data.groups || [];
            console.log('SonosSection: Loaded groups:', this.groups.length);
        } catch (error) {
            console.error('SonosSection: Failed to load groups:', error);
            this.groups = [];
        }
    }

    renderUnifiedView() {
        const content = document.getElementById('sonos-content');
        if (!content) return;

        // Update device count
        const deviceCount = document.getElementById('sonos-device-count');
        if (deviceCount) {
            deviceCount.textContent = `${this.devices.length} devices`;
        }

        // Render devices and groups
        let html = '<div class="sonos-unified-view">';

        // Groups section
        if (this.groups.length > 0) {
            html += '<div class="sonos-groups-section">';
            html += '<h2 class="section-title">Groups</h2>';
            html += '<div class="sonos-groups-grid">';

            this.groups.forEach(group => {
                html += this.renderGroupCard(group);
            });

            html += '</div></div>';
        }

        // Individual devices section
        if (this.devices.length > 0) {
            html += '<div class="sonos-devices-section">';
            html += '<h2 class="section-title">Devices</h2>';
            html += '<div class="sonos-devices-grid">';

            this.devices.forEach(device => {
                html += this.renderDeviceCard(device);
            });

            html += '</div></div>';
        }

        html += '</div>';
        content.innerHTML = html;
    }

    renderGroupCard(group) {
        return `
            <div class="sonos-group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <h3 class="group-name">${group.coordinator?.name || 'Unknown Group'}</h3>
                    <div class="group-status">
                        <span class="status-indicator ${(group.state || 'STOPPED').toLowerCase()}">${group.state || 'STOPPED'}</span>
                    </div>
                </div>
                <div class="group-controls">
                    <button class="control-btn play-pause" data-group-id="${group.id}">
                        <span class="material-symbols-outlined">${(group.state || 'STOPPED') === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                    </button>
                    <button class="control-btn stop" data-group-id="${group.id}">
                        <span class="material-symbols-outlined">stop</span>
                    </button>
                    <button class="control-btn next" data-group-id="${group.id}">
                        <span class="material-symbols-outlined">skip_next</span>
                    </button>
                </div>
                <div class="group-info">
                    <div class="track-info">
                        <div class="track-title">${group.currentTrack?.title || 'No track'}</div>
                        <div class="track-artist">${group.currentTrack?.artist || ''}</div>
                    </div>
                    <div class="volume-control">
                        <span class="material-symbols-outlined">volume_up</span>
                        <input type="range" class="volume-slider" min="0" max="100" value="${group.volume || 0}" data-group-id="${group.id}">
                        <span class="volume-value">${group.volume || 0}%</span>
                    </div>
                    </div>
                </div>
            `;
    }

    renderDeviceCard(device) {
        return `
            <div class="sonos-device-card" data-device-id="${device.id}">
                <div class="device-header">
                    <h3 class="device-name">${device.name}</h3>
                    <div class="device-status">
                        <span class="status-indicator ${(device.state || 'STOPPED').toLowerCase()}">${device.state || 'STOPPED'}</span>
                    </div>
                </div>
                <div class="device-controls">
                    <button class="control-btn play-pause" data-device-id="${device.id}">
                        <span class="material-symbols-outlined">${(device.state || 'STOPPED') === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                    </button>
                    <button class="control-btn stop" data-device-id="${device.id}">
                        <span class="material-symbols-outlined">stop</span>
                    </button>
                    <button class="control-btn next" data-device-id="${device.id}">
                        <span class="material-symbols-outlined">skip_next</span>
                    </button>
                </div>
                <div class="device-info">
                <div class="track-info">
                        <div class="track-title">${device.currentTrack?.title || 'No track'}</div>
                        <div class="track-artist">${device.currentTrack?.artist || ''}</div>
                    </div>
                    <div class="volume-control">
                        <span class="material-symbols-outlined">volume_up</span>
                        <input type="range" class="volume-slider" min="0" max="100" value="${device.volume || 0}" data-device-id="${device.id}">
                        <span class="volume-value">${device.volume || 0}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    connectWebSocket() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            console.log('SonosSection: WebSocket already connected');
            return;
        }

        console.log('SonosSection: Connecting to WebSocket...');
        this.websocket = new WebSocket('ws://localhost:3000/ws/sonos');

        this.websocket.onopen = () => {
            console.log('SonosSection: WebSocket connected');
            this.isConnected = true;
            this.updateConnectionStatus('online');
        };

        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('SonosSection: Error parsing WebSocket message:', error);
            }
        };

        this.websocket.onclose = () => {
            console.log('SonosSection: WebSocket disconnected');
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        };

        this.websocket.onerror = (error) => {
            console.error('SonosSection: WebSocket error:', error);
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        };
    }

    disconnectWebSocket() {
        if (this.websocket) {
            console.log('SonosSection: Disconnecting WebSocket...');
            this.websocket.close();
            this.websocket = null;
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        }
    }

    handleWebSocketMessage(data) {
        console.log('SonosSection: WebSocket message received:', data);

        if (data.type === 'device_update') {
            this.updateDevice(data.device);
        } else if (data.type === 'group_update') {
            this.updateGroup(data.group);
        }
    }

    updateDevice(device) {
        // Update device in the devices array
        const index = this.devices.findIndex(d => d.id === device.id);
        if (index !== -1) {
            this.devices[index] = device;
        }

        // Update UI
        this.renderUnifiedView();
    }

    updateGroup(group) {
        // Update group in the groups array
        const index = this.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
            this.groups[index] = group;
        }

        // Update UI
        this.renderUnifiedView();
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('sonos-connection-status');
        if (statusElement) {
            statusElement.textContent = status === 'online' ? 'Online' : 'Offline';
            statusElement.className = `status-indicator ${status}`;
        }
    }

    // Override base class methods to prevent automatic behavior
    activate() {
        console.log('SonosSection: activate() called - no automatic behavior');
    }

    show() {
        console.log('SonosSection: show() called - no automatic behavior');
    }

    hide() {
        console.log('SonosSection: hide() called - no automatic behavior');
    }
}

// Initialize the Sonos section
const sonosSection = new SonosSection();