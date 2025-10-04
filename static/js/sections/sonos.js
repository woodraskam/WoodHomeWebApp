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

        // Initialize immediately
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createSonosSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            console.log('SonosSection: sectionload event received:', e.detail);
            if (e.detail.section === 'sonos') {
                console.log('SonosSection: sectionload event for sonos, calling load()');
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            console.log('SonosSection: sectionchange event received:', e.detail);
            if (e.detail.section === 'sonos') {
                console.log('SonosSection: sectionchange event for sonos, calling load(), show(), and connectWebSocket()');
                this.load();
                this.show();
                this.connectWebSocket();
            } else {
                console.log('SonosSection: sectionchange event for other section, hiding and disconnecting WebSocket');
                this.hide();
                this.disconnectWebSocket();
            }
        });

        // Also listen for hash changes in case the router doesn't dispatch events
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            console.log('SonosSection: hashchange event, hash:', hash);
            if (hash === '#sonos') {
                console.log('SonosSection: hashchange to sonos, calling load(), show(), and connectWebSocket()');
                this.load();
                this.show();
                this.connectWebSocket();
            } else {
                this.hide();
                this.disconnectWebSocket();
            }
        });
    }

    /**
     * Override base class initialize method
     */
    initialize() {
        console.log('SonosSection: initialize() called');
        // Only initialize if authenticated
        if (this.isAuthenticated()) {
            console.log('SonosSection: User is authenticated, setting up Sonos event listeners and connecting WebSocket');
            this.setupSonosEventListeners();
            this.connectWebSocket();
        } else {
            console.log('SonosSection: User is not authenticated, showing authentication required');
            this.showAuthenticationRequired();
        }
    }

    /**
     * Override base class show method
     */
    show() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.add('m3-section--active');
            section.style.display = 'block';
            console.log('SonosSection: Section shown');
        } else {
            console.warn('SonosSection: sonos-section element not found when trying to show');
            // Try to create the section if it doesn't exist
            this.createSonosSection();
            // Try again after a short delay
            setTimeout(() => {
                const retrySection = document.getElementById('sonos-section');
                if (retrySection) {
                    retrySection.classList.add('m3-section--active');
                    retrySection.style.display = 'block';
                    console.log('SonosSection: Section shown on retry');
                }
            }, 100);
        }
    }

    /**
     * Override base class hide method
     */
    hide() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }

    /**
     * Override base class cleanup method
     */
    cleanup() {
        // Disconnect WebSocket
        this.disconnectWebSocket();
        // Clear data
        this.devices = [];
        this.groups = [];
        this.isConnected = false;
    }

    /**
     * Override base class showAuthenticationRequired method
     */
    showAuthenticationRequired() {
        // Show authentication prompt or redirect to login
        const section = document.getElementById('sonos-section');
        if (section) {
            section.innerHTML = `
                <div class="m3-card">
                    <div class="m3-card__content">
                        <div class="m3-calendar-auth">
                            <div class="m3-calendar-auth__icon">
                                <span class="material-symbols-outlined">music_note</span>
                            </div>
                            <div class="m3-calendar-auth__content">
                                <h3 class="m3-calendar-auth__title">Connect to Sonos Audio</h3>
                                <p class="m3-calendar-auth__description">
                                    Please authenticate to access your Sonos audio controls.
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

    createSonosSection() {
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
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="sonos-actions">
                <button id="sonos-play-all" class="m3-button m3-button-filled">
                    <span class="material-symbols-outlined interactive play-button">play_arrow</span>
                    Play All
                </button>
                <button id="sonos-pause-all" class="m3-button m3-button-outlined">
                    <span class="material-symbols-outlined interactive">pause</span>
                    Pause All
                </button>
                <button id="sonos-stop-all" class="m3-button m3-button-outlined">
                    <span class="material-symbols-outlined interactive">stop</span>
                    Stop All
                </button>
                <button id="sonos-refresh" class="m3-button m3-button-outlined">
                    <span class="material-symbols-outlined interactive">refresh</span>
                    Refresh
                </button>
            </div>

            <!-- Unified Devices & Groups Grid -->
            <div class="sonos-devices-section">
                <h3>Sonos Devices & Groups</h3>
                <div class="sonos-devices-grid" id="sonos-devices-grid">
                    <!-- Devices and groups will be populated here -->
                </div>
            </div>

            <!-- Group Management Modal -->
            <div id="sonos-group-modal" class="m3-modal" style="display: none;">
                <div class="m3-modal-content">
                    <div class="m3-modal-header">
                        <h3>Create Group</h3>
                        <button class="m3-button m3-button-text" onclick="this.closest('.m3-modal').style.display='none'">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="m3-modal-body">
                        <div id="sonos-group-devices">
                            <!-- Available devices for grouping -->
                        </div>
                    </div>
                    <div class="m3-modal-footer">
                        <button id="sonos-create-group" class="m3-button m3-button-filled">Create Group</button>
                        <button class="m3-button m3-button-outlined" onclick="this.closest('.m3-modal').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        contentArea.appendChild(sonosSection);
    }

    load() {
        console.log('SonosSection: load() called, isLoaded:', this.isLoaded);
        if (!this.isLoaded) {
            console.log('SonosSection: First time loading, setting up event listeners and loading data');
            this.isLoaded = true;
            this.setupSonosEventListeners();
            // Load both devices and groups, then render unified view
            this.loadUnifiedData();
        }
        this.show();

        // Ensure the section is visible and properly rendered
        setTimeout(() => {
            this.ensureSectionVisible();
        }, 100);
    }

    ensureSectionVisible() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.style.display = 'block';
            section.classList.add('m3-section--active');
            console.log('SonosSection: Ensured section is visible');
        } else {
            console.warn('SonosSection: sonos-section element not found');
        }
    }

    ensureSectionExists() {
        const section = document.getElementById('sonos-section');
        if (!section) {
            console.log('SonosSection: Section does not exist, creating it');
            this.createSonosSection();
        }
    }

    async loadUnifiedData() {
        // Ensure section exists before loading data
        this.ensureSectionExists();
        this.showLoadingState();

        try {
            // Load both devices and groups in parallel
            const [devicesResponse, groupsResponse] = await Promise.all([
                fetch('/api/sonos/devices'),
                fetch('/api/sonos/groups')
            ]);

            // Process devices
            if (devicesResponse.ok) {
                const devicesData = await devicesResponse.json();
                this.devices = devicesData.devices || [];
            } else {
                console.error('[UNIFIED LOAD] Failed to load devices');
                this.devices = [];
            }

            // Process groups
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                this.groups = groupsData.groups || [];
            } else {
                console.error('[UNIFIED LOAD] Failed to load groups');
                this.groups = [];
            }

            // Render unified view with both devices and groups
            this.renderDevices();
            this.updateConnectionStatus('online');

        } catch (error) {
            console.error('[UNIFIED LOAD] Error loading Sonos data:', error);
            this.updateConnectionStatus('offline');
            this.showDemoContent();
        }
    }

    showLoadingState() {
        const devicesGrid = document.getElementById('sonos-devices-grid');
        if (devicesGrid) {
            devicesGrid.innerHTML = `
                <div class="m3-card loading-card">
                    <div class="m3-card-content">
                        <div class="loading-spinner"></div>
                        <p>Loading Sonos devices...</p>
                    </div>
                </div>
            `;
        }
    }

    show() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }

    setupSonosEventListeners() {
        // Quick action buttons
        document.getElementById('sonos-play-all')?.addEventListener('click', () => this.playAllDevices());
        document.getElementById('sonos-pause-all')?.addEventListener('click', () => this.pauseAllDevices());
        document.getElementById('sonos-stop-all')?.addEventListener('click', () => this.stopAllDevices());
        document.getElementById('sonos-refresh')?.addEventListener('click', () => this.refreshDevices());
    }

    connectWebSocket() {
        if (this.websocket) return; // Already connected

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sonos`;

        try {
            this.websocket = new WebSocket(wsUrl);

            // Set timeout to prevent hanging
            const timeout = setTimeout(() => {
                if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
                    this.websocket.close();
                    this.updateConnectionStatus('offline');
                }
            }, 5000);

            this.websocket.onopen = () => {
                clearTimeout(timeout);
                this.isConnected = true;
                this.updateConnectionStatus('online');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                clearTimeout(timeout);
                this.isConnected = false;
                this.updateConnectionStatus('offline');
            };

            this.websocket.onerror = (error) => {
                clearTimeout(timeout);
                console.error('Sonos WebSocket error:', error);
                this.updateConnectionStatus('error');
                // Fallback to HTTP API
                this.loadDevices();
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.updateConnectionStatus('error');
            // Fallback to HTTP API
            this.loadDevices();
        }
    }

    disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.isConnected = false;
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'devices':
                this.devices = data.devices;
                this.renderDevices();
                break;
            case 'groups':
                this.groups = data.groups;
                this.renderGroups();
                break;
            case 'device_update':
                this.updateDevice(data.device);
                break;
            case 'group_update':
                this.updateGroup(data.group);
                break;
        }
    }

    updateDevice(deviceData) {
        // Update device in local array
        const deviceIndex = this.devices.findIndex(d => d.uuid === deviceData.uuid);
        if (deviceIndex !== -1) {
            this.devices[deviceIndex] = { ...this.devices[deviceIndex], ...deviceData };
        }
    }

    updateGroup(groupData) {
        // Update group in local array
        const groupIndex = this.groups.findIndex(g => g.id === groupData.id);
        if (groupIndex !== -1) {
            this.groups[groupIndex] = { ...this.groups[groupIndex], ...groupData };
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('sonos-connection-status');
        if (statusElement) {
            statusElement.className = `status-indicator ${status}`;
            statusElement.textContent = status === 'online' ? 'Online' :
                status === 'error' ? 'Error' : 'Offline';
        }

        const countElement = document.getElementById('sonos-device-count');
        if (countElement) {
            countElement.textContent = `${this.devices.length} devices`;
        }
    }

    async loadDevices() {
        try {
            const response = await fetch('/api/sonos/devices');
            const data = await response.json();

            if (response.ok) {
                this.devices = data.devices || [];
                this.renderDevices(); // Keep this for refresh operations
                this.updateConnectionStatus('online');
            } else {
                console.error('[LOAD DEVICES DEBUG] Failed to load devices:', data);
                this.updateConnectionStatus('offline');
            }
        } catch (error) {
            console.error('[LOAD DEVICES DEBUG] Error loading devices:', error);
            this.updateConnectionStatus('offline');
        }
    }

    async loadGroups() {
        try {
            const response = await fetch('/api/sonos/groups');
            const data = await response.json();

            if (response.ok) {
                this.groups = data.groups || [];
                this.renderDevices(); // Render unified view
            } else {
                console.error('[LOAD GROUPS DEBUG] Failed to load groups:', data);
                this.groups = [];
                this.renderDevices(); // Render unified view
            }
        } catch (error) {
            console.error('[LOAD GROUPS DEBUG] Error loading groups:', error);
            this.groups = [];
            this.renderDevices(); // Render unified view
        }
    }

    showDemoContent() {
        // Show demo devices when API is not available
        this.devices = [
            {
                id: 'demo-living-room',
                name: 'Living Room Speaker',
                roomName: 'Living Room',
                playbackState: 'STOPPED',
                volume: 50
            },
            {
                id: 'demo-kitchen',
                name: 'Kitchen Speaker',
                roomName: 'Kitchen',
                playbackState: 'STOPPED',
                volume: 30
            },
            {
                id: 'demo-bedroom',
                name: 'Bedroom Speaker',
                roomName: 'Bedroom',
                playbackState: 'STOPPED',
                volume: 25
            }
        ];

        this.groups = [
            {
                id: 'demo-group-1',
                name: 'Downstairs',
                devices: ['demo-living-room', 'demo-kitchen'],
                playbackState: 'STOPPED'
            }
        ];

        this.renderDevices();
        this.renderGroups();

        // Show demo message
        const devicesGrid = document.getElementById('sonos-devices-grid');
        if (devicesGrid) {
            const demoMessage = document.createElement('div');
            demoMessage.className = 'm3-card demo-message';
            demoMessage.innerHTML = `
                <div class="m3-card-content">
                    <h4>Demo Mode</h4>
                    <p>Sonos API is not available. This is demo content showing how the interface would look with real Sonos devices.</p>
                    <p>To enable real Sonos control, ensure the Sonos service is running and accessible.</p>
                </div>
            `;
            devicesGrid.insertBefore(demoMessage, devicesGrid.firstChild);
        }
    }

    renderDevices() {
        const grid = document.getElementById('sonos-devices-grid');
        if (!grid) return;


        // Create unified items (groups first, then individual devices)
        const unifiedItems = this.createUnifiedItems();

        grid.innerHTML = unifiedItems.map(item => {
            if (item.type === 'group') {
                return this.createGroupCardHTML(item);
            } else {
                return this.createDeviceCardHTML(item);
            }
        }).join('');

        // Initialize M3 sliders and tooltips after rendering
        this.initializeM3Sliders();
        this.initializeM3Tooltips();
    }

    createUnifiedItems() {
        const items = [];
        const devicesInGroups = new Set();

        // First, mark all devices that are in groups
        this.groups.forEach(group => {
            if (group.members) {
                group.members.forEach(member => {
                    devicesInGroups.add(member.uuid);
                });
            }
        });

        // Add groups with coordinator names for sorting
        this.groups.forEach(group => {
            items.push({
                type: 'group',
                id: group.id,
                coordinator: group.coordinator,
                members: group.members || [],
                status: group.state || group.playback_state,
                volume: group.volume,
                currentTrack: group.current_track,
                sortName: group.coordinator?.name || '' // Use coordinator name for sorting
            });
        });

        // Add individual devices (not in any group)
        this.devices
            .filter(device => !devicesInGroups.has(device.uuid))
            .forEach(device => {
                items.push({
                    type: 'device',
                    id: device.uuid,
                    name: device.name,
                    room: device.room,
                    status: device.state || 'STOPPED',
                    volume: device.volume || 0,
                    currentTrack: device.current_track,
                    isOnline: device.is_online,
                    sortName: device.name // Use device name for sorting
                });
            });

        // Sort all items alphabetically by their sort name
        return items.sort((a, b) => a.sortName.localeCompare(b.sortName));
    }

    createGroupCardHTML(group) {
        return `
            <div class="m3-card sonos-group-card" data-group-id="${group.id}">
                <div class="m3-card-header">
                    <h4><span class="material-symbols-outlined large interactive">speaker_group</span> ${group.coordinator.name}</h4>
                    <button class="m3-tooltip-trigger" data-group-id="${group.id}" aria-label="Group details">
                        <span class="material-symbols-outlined interactive">info</span>
                    </button>
                </div>
                <div class="m3-card-content">
                    <div class="coordinator">
                        <div class="coordinator-volume-control">
                            <span class="material-symbols-outlined volume-icon">volume_up</span>
                            <input type="range" min="0" max="100" value="${group.volume || 0}" 
                                   class="m3-slider" data-group-id="${group.id}"
                                   oninput="window.sonosSection.updateSliderProgress(this); window.sonosSection.updateVolumeDisplay('${group.id}', this.value, 'group')"
                                   onchange="window.sonosSection.setGroupVolume('${group.id}', this.value)"
                                   onmouseup="window.sonosSection.setGroupVolume('${group.id}', this.value)"
                                   ontouchend="window.sonosSection.setGroupVolume('${group.id}', this.value)">
                            <span class="volume-display">${group.volume || 0}%</span>
                        </div>
                    </div>
                    <div class="group-members">
                        ${group.members.filter(member => member.uuid !== group.coordinator?.uuid).map(member => `
                            <div class="member-device" data-device-id="${member.uuid}">
                                <div class="member-info">
                                    <span class="material-symbols-outlined small">speaker</span>
                                    <span class="member-name">${member.name}</span>
                                </div>
                                <div class="member-volume-control">
                                    <span class="material-symbols-outlined volume-icon small">volume_up</span>
                                    <input type="range" min="0" max="100" value="${member.volume || 0}" 
                                           class="m3-slider" data-device-id="${member.uuid}"
                                           oninput="window.sonosSection.updateSliderProgress(this); window.sonosSection.updateVolumeDisplay('${member.uuid}', this.value)"
                                           onchange="window.sonosSection.setMemberVolume('${member.uuid}', this.value)"
                                           onmouseup="window.sonosSection.setMemberVolume('${member.uuid}', this.value)"
                                           ontouchend="window.sonosSection.setMemberVolume('${member.uuid}', this.value)">
                                    <span class="volume-display">${member.volume || 0}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="sonos-playback-controls">
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.toggleGroupPlayPause('${group.id}')">
                            <span class="material-symbols-outlined interactive play-button">${group.status === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.stopGroup('${group.id}')">
                            <span class="material-symbols-outlined interactive">stop</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createDeviceCardHTML(device) {
        return `
            <div class="m3-card sonos-device-card" data-device-id="${device.id}">
                <div class="m3-card-header">
                    <h4><span class="material-symbols-outlined large interactive">speaker</span> ${device.name}</h4>
                    <button class="m3-tooltip-trigger" data-device-id="${device.id}" aria-label="Device details">
                        <span class="material-symbols-outlined interactive">info</span>
                    </button>
                </div>
                <div class="m3-card-content">
                    <div class="device-volume-control">
                        <span class="material-symbols-outlined volume-icon">volume_up</span>
                        <input type="range" min="0" max="100" value="${device.volume}" 
                               class="m3-slider" data-device-id="${device.id}"
                               oninput="window.sonosSection.updateSliderProgress(this); window.sonosSection.updateVolumeDisplay('${device.id}', this.value)"
                               onchange="window.sonosSection.setVolume('${device.id}', this.value)"
                               onmouseup="window.sonosSection.setVolume('${device.id}', this.value)"
                               ontouchend="window.sonosSection.setVolume('${device.id}', this.value)">
                        <span class="volume-display">${device.volume}%</span>
                    </div>
                    <div class="sonos-playback-controls">
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.togglePlayPause('${device.id}')">
                            <span class="material-symbols-outlined interactive play-button">${device.status === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.stopDevice('${device.id}')">
                            <span class="material-symbols-outlined interactive">stop</span>
                        </button>
                    </div>
                    ${this.getCurrentTrackDisplay(device.currentTrack)}
                </div>
            </div>
        `;
    }

    // M3 Slider Progress Update
    updateSliderProgress(slider) {
        const progress = (slider.value / slider.max) * 100;
        slider.style.setProperty('--slider-progress', `${progress}%`);
    }

    // Set volume for group members
    async setMemberVolume(memberId, volume) {
        console.log(`Setting member volume for ${memberId} to ${volume}%`);

        try {
            const response = await fetch(`/api/sonos/devices/${memberId}/volume/${volume}`, {
                method: 'POST'
            });
            if (!response.ok) {
                // Revert the slider on error
                const slider = document.querySelector(`[data-device-id="${memberId}"] .m3-slider`);
                const volumeDisplay = document.querySelector(`[data-device-id="${memberId}"] .volume-display`);
                if (slider && volumeDisplay) {
                    // Find the original member volume to revert to
                    for (const group of this.groups) {
                        const member = group.members.find(m => m.uuid === memberId);
                        if (member) {
                            slider.value = member.volume || 0;
                            this.updateSliderProgress(slider);
                            volumeDisplay.textContent = `${member.volume || 0}%`;
                            break;
                        }
                    }
                }
                console.error('Failed to set member volume: API returned error');
            } else {
                // Update local group data immediately and re-render
                console.log('Member volume updated successfully to:', volume);
                for (const group of this.groups) {
                    const member = group.members.find(m => m.uuid === memberId);
                    if (member) {
                        member.volume = parseInt(volume);
                        this.renderDevices(); // Re-render with updated data
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to set member volume:', error);
            // Revert the slider on error
            const slider = document.querySelector(`[data-device-id="${memberId}"] .m3-slider`);
            const volumeDisplay = document.querySelector(`[data-device-id="${memberId}"] .volume-display`);
            if (slider && volumeDisplay) {
                // Find the original member volume to revert to
                for (const group of this.groups) {
                    const member = group.members.find(m => m.uuid === memberId);
                    if (member) {
                        slider.value = member.volume || 0;
                        this.updateSliderProgress(slider);
                        volumeDisplay.textContent = `${member.volume || 0}%`;
                        break;
                    }
                }
            }
        }
    }

    // Update volume display during dragging (no API call)
    updateVolumeDisplay(id, volume, type = 'device') {
        const volumeDisplay = document.querySelector(`[data-${type}-id="${id}"] .volume-display`);
        if (volumeDisplay) {
            volumeDisplay.textContent = `${volume}%`;
        }
    }

    // Initialize M3 Sliders after rendering
    initializeM3Sliders() {
        const sliders = document.querySelectorAll('.m3-slider');
        sliders.forEach(slider => {
            this.updateSliderProgress(slider);
        });
    }

    // Get tooltip content for groups
    getGroupTooltipContent(group) {
        const members = group.members ? group.members.filter(member => member.uuid !== group.coordinator?.uuid) : [];
        const memberNames = members.map(member => member.name).join(', ');

        return `
            <div class="m3-tooltip-content">
                <h6>Group Details</h6>
                <p><strong>Coordinator:</strong> ${group.coordinator.name}</p>
                <p><strong>Status:</strong> ${group.status || 'STOPPED'}</p>
                <p><strong>Volume:</strong> ${group.volume || 0}%</p>
                <p><strong>Track:</strong> ${this.getTrackInfo(group.currentTrack) || 'No music selected'}</p>
                ${memberNames ? `<p><strong>Members:</strong> ${memberNames}</p>` : ''}
                <p><strong>Group ID:</strong> ${group.id}</p>
            </div>
        `;
    }

    // Get tooltip content for devices
    getDeviceTooltipContent(device) {
        // Handle both currentTrack and current_track field names
        const currentTrack = device.currentTrack || device.current_track;
        return `
            <div class="m3-tooltip-content">
                <h6>Device Details</h6>
                <p><strong>Name:</strong> ${device.name}</p>
                <p><strong>Room:</strong> ${device.room}</p>
                <p><strong>Status:</strong> ${device.status}</p>
                <p><strong>Volume:</strong> ${device.volume}%</p>
                <p><strong>Track:</strong> ${this.getTrackInfo(currentTrack) || 'No music selected'}</p>
                <p><strong>Device ID:</strong> ${device.uuid}</p>
                <p><strong>Online:</strong> ${device.is_online ? 'Yes' : 'No'}</p>
            </div>
        `;
    }

    // Initialize M3 Tooltips
    initializeM3Tooltips() {
        const tooltipTriggers = document.querySelectorAll('.m3-tooltip-trigger');
        tooltipTriggers.forEach(trigger => {
            this.setupTooltip(trigger);
        });
    }

    // Setup individual tooltip
    setupTooltip(trigger) {
        let tooltip = null;
        let showTimeout = null;
        let hideTimeout = null;

        const showTooltip = () => {
            if (tooltip) return;

            // Get tooltip content based on trigger type
            let tooltipContent = '';
            const groupId = trigger.getAttribute('data-group-id');
            const deviceId = trigger.getAttribute('data-device-id');

            if (groupId) {
                const group = this.groups.find(g => g.id === groupId);
                if (group) {
                    tooltipContent = this.getGroupTooltipContent(group);
                }
            } else if (deviceId) {
                // Look in both the original devices array and the unified items
                let device = this.devices.find(d => d.uuid === deviceId);
                if (!device) {
                    // Try to find in unified items (which have id instead of uuid)
                    const unifiedItem = this.createUnifiedItems().find(item => item.type === 'device' && item.id === deviceId);
                    if (unifiedItem) {
                        device = unifiedItem;
                    }
                }
                if (device) {
                    tooltipContent = this.getDeviceTooltipContent(device);
                }
            }

            if (!tooltipContent) return;

            tooltip = document.createElement('div');
            tooltip.className = 'm3-tooltip';
            tooltip.innerHTML = tooltipContent;

            document.body.appendChild(tooltip);

            // Position tooltip
            const rect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            // Position above the trigger
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
            tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;

            // Add show animation
            requestAnimationFrame(() => {
                tooltip.classList.add('m3-tooltip--visible');
            });
        };

        const hideTooltip = () => {
            if (!tooltip) return;

            tooltip.classList.remove('m3-tooltip--visible');
            setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                tooltip = null;
            }, 200);
        };

        // Mouse events
        trigger.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(showTooltip, 300);
        });

        trigger.addEventListener('mouseleave', () => {
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(hideTooltip, 100);
        });

        // Focus events for accessibility
        trigger.addEventListener('focus', () => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(showTooltip, 300);
        });

        trigger.addEventListener('blur', () => {
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(hideTooltip, 100);
        });

        // Click to toggle (mobile-friendly)
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (tooltip) {
                hideTooltip();
            } else {
                showTooltip();
            }
        });
    }

    getTrackInfo(currentTrack) {
        if (!currentTrack) return null;

        // Check for TV/SPDIF input (HDMI ARC)
        if (currentTrack.uri && currentTrack.uri.includes('spdif')) {
            return 'TV Audio (HDMI ARC)';
        }

        // Check for other line input types
        if (currentTrack.type === 'line_in' && currentTrack.uri) {
            if (currentTrack.uri.includes('htastream')) {
                return 'TV Audio';
            }
            return 'Line Input';
        }

        // Check if we have meaningful track information
        const hasTitle = currentTrack.title && currentTrack.title.trim() !== '';
        const hasArtist = currentTrack.artist && currentTrack.artist.trim() !== '';

        if (hasTitle && hasArtist) {
            return `${currentTrack.artist} - ${currentTrack.title}`;
        } else if (hasTitle) {
            return currentTrack.title;
        } else if (hasArtist) {
            return currentTrack.artist;
        }

        return null;
    }

    getCurrentTrackDisplay(currentTrack) {
        if (!currentTrack) return '';

        // Check for TV/SPDIF input (HDMI ARC)
        if (currentTrack.uri && currentTrack.uri.includes('spdif')) {
            return `
                <div class="current-track-display">
                    <div class="track-info">
                        <span class="material-symbols-outlined">tv</span>
                        <span class="track-text">TV Audio (HDMI ARC)</span>
                    </div>
                </div>
            `;
        }

        // Check for other line input types
        if (currentTrack.type === 'line_in' && currentTrack.uri) {
            let inputType = 'Line Input';
            if (currentTrack.uri.includes('htastream')) {
                inputType = 'TV Audio';
            }
            return `
                <div class="current-track-display">
                    <div class="track-info">
                        <span class="material-symbols-outlined">input</span>
                        <span class="track-text">${inputType}</span>
                    </div>
                </div>
            `;
        }

        // Check if we have meaningful track information
        const hasTitle = currentTrack.title && currentTrack.title.trim() !== '';
        const hasArtist = currentTrack.artist && currentTrack.artist.trim() !== '';
        const hasAlbum = currentTrack.album && currentTrack.album.trim() !== '';
        const hasArt = currentTrack.art && currentTrack.art.trim() !== '';

        if (!hasTitle && !hasArtist) {
            return '';
        }

        let trackDisplay = '';
        if (hasTitle && hasArtist) {
            trackDisplay = `${currentTrack.artist} - ${currentTrack.title}`;
        } else if (hasTitle) {
            trackDisplay = currentTrack.title;
        } else if (hasArtist) {
            trackDisplay = currentTrack.artist;
        }

        let albumArtHTML = '';
        if (hasArt) {
            albumArtHTML = `
                <div class="album-art-container">
                    <img src="${currentTrack.art}" 
                         alt="Album Art" 
                         class="album-art"
                         onerror="this.style.display='none'"
                         loading="lazy">
                </div>
            `;
        }

        return `
            <div class="current-track-display">
                ${albumArtHTML}
                <div class="track-info">
                    <span class="material-symbols-outlined">music_note</span>
                    <div class="track-details">
                        <div class="track-text">${trackDisplay}</div>
                        ${hasAlbum ? `<div class="album-text">${currentTrack.album}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }


    // Device control methods
    async togglePlayPause(deviceId) {
        // Handle demo mode
        if (deviceId && deviceId.startsWith('demo-')) {
            const device = this.devices.find(d => d.uuid === deviceId);
            if (device) {
                device.state = device.state === 'PLAYING' ? 'STOPPED' : 'PLAYING';
                this.renderDevices();
            }
            return;
        }

        try {
            // Find the device to check its current state
            const device = this.devices.find(d => d.uuid === deviceId);
            if (!device) {
                console.error('Device not found:', deviceId);
                return;
            }

            let endpoint;
            if (device.state === 'PLAYING') {
                endpoint = `/api/sonos/devices/${deviceId}/pause`;
            } else {
                endpoint = `/api/sonos/devices/${deviceId}/play`;
            }

            const response = await fetch(endpoint, { method: 'POST' });
            if (response.ok) {
                this.loadDevices(); // Refresh device states
            }
        } catch (error) {
            console.error('Failed to toggle play/pause:', error);
        }
    }

    async stopDevice(deviceId) {
        // Handle demo mode
        if (deviceId && deviceId.startsWith('demo-')) {
            const device = this.devices.find(d => d.uuid === deviceId);
            if (device) {
                device.state = 'STOPPED';
                this.renderDevices();
            }
            return;
        }

        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/stop`, { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
            }
        } catch (error) {
            console.error('Failed to stop device:', error);
        }
    }

    async setVolume(deviceId, volume) {
        // Handle demo mode
        if (deviceId && deviceId.startsWith('demo-')) {
            // Update the device in our local array
            const device = this.devices.find(d => d.uuid === deviceId);
            if (device) {
                device.volume = parseInt(volume);
            }
            return;
        }

        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/volume/${volume}`, {
                method: 'POST'
            });
            if (!response.ok) {
                // Revert the slider on error
                const slider = document.querySelector(`[data-device-id="${deviceId}"] .m3-slider`);
                const volumeDisplay = document.querySelector(`[data-device-id="${deviceId}"] .volume-display`);
                if (slider && volumeDisplay) {
                    // Find the original device volume to revert to
                    const device = this.devices.find(d => d.uuid === deviceId);
                    if (device) {
                        slider.value = device.volume;
                        this.updateSliderProgress(slider);
                        volumeDisplay.textContent = `${device.volume}%`;
                    }
                }
                console.error('Failed to set volume: API returned error');
            } else {
                // Update local data immediately and re-render
                const device = this.devices.find(d => d.uuid === deviceId);
                if (device) {
                    device.volume = parseInt(volume);
                    this.renderDevices(); // Re-render with updated data
                }
            }
        } catch (error) {
            console.error('Failed to set volume:', error);
            // Revert the slider on error
            const slider = document.querySelector(`[data-device-id="${deviceId}"] .m3-slider`);
            const volumeDisplay = document.querySelector(`[data-device-id="${deviceId}"] .volume-display`);
            if (slider && volumeDisplay) {
                // Find the original device volume to revert to
                const device = this.devices.find(d => d.uuid === deviceId);
                if (device) {
                    slider.value = device.volume;
                    this.updateSliderProgress(slider);
                    volumeDisplay.textContent = `${device.volume}%`;
                }
            }
        }
    }

    // Group control methods
    async toggleGroupPlayPause(groupId) {
        try {
            // Find the group to check its current state
            const group = this.groups.find(g => g.id === groupId);
            if (!group) {
                console.error('Group not found:', groupId);
                return;
            }

            let endpoint;
            if (group.state === 'PLAYING' || group.playback_state === 'PLAYING') {
                endpoint = `/api/sonos/groups/${groupId}/pause`;
            } else {
                endpoint = `/api/sonos/groups/${groupId}/play`;
            }

            const response = await fetch(endpoint, { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
                this.loadGroups();
            }
        } catch (error) {
            console.error('Failed to toggle group play/pause:', error);
        }
    }

    async stopGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/stop`, { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
                this.loadGroups();
            }
        } catch (error) {
            console.error('Failed to stop group:', error);
        }
    }

    async setGroupVolume(groupId, volume) {

        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/volume/${volume}`, { method: 'POST' });
            if (!response.ok) {
                // Revert the slider on error
                const slider = document.querySelector(`[data-group-id="${groupId}"] .m3-slider`);
                const volumeDisplay = document.querySelector(`[data-group-id="${groupId}"] .volume-display`);
                if (slider && volumeDisplay) {
                    // Find the original group volume to revert to
                    const group = this.groups.find(g => g.id === groupId);
                    if (group) {
                        slider.value = group.volume || 0;
                        this.updateSliderProgress(slider);
                        volumeDisplay.textContent = `${group.volume || 0}%`;
                    }
                }
                console.error('Failed to set group volume: API returned error');
            } else {
                // Update local data immediately and re-render
                const group = this.groups.find(g => g.id === groupId);
                if (group) {
                    group.volume = parseInt(volume);
                    this.renderDevices(); // Re-render with updated data
                }
            }
        } catch (error) {
            console.error('Failed to set group volume:', error);
            // Revert the slider on error
            const slider = document.querySelector(`[data-group-id="${groupId}"] .m3-slider`);
            const volumeDisplay = document.querySelector(`[data-group-id="${groupId}"] .volume-display`);
            if (slider && volumeDisplay) {
                // Find the original group volume to revert to
                const group = this.groups.find(g => g.id === groupId);
                if (group) {
                    slider.value = group.volume || 0;
                    this.updateSliderProgress(slider);
                    volumeDisplay.textContent = `${group.volume || 0}%`;
                }
            }
        }
    }

    // Quick actions
    async playAllDevices() {
        try {
            const response = await fetch('/api/sonos/play-all', { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
            }
        } catch (error) {
            console.error('Failed to play all devices:', error);
        }
    }

    async pauseAllDevices() {
        try {
            const response = await fetch('/api/sonos/pause-all', { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
            }
        } catch (error) {
            console.error('Failed to pause all devices:', error);
        }
    }

    async stopAllDevices() {
        try {
            const response = await fetch('/api/sonos/stop-all', { method: 'POST' });
            if (response.ok) {
                this.loadDevices();
            }
        } catch (error) {
            console.error('Failed to stop all devices:', error);
        }
    }

    async refreshDevices() {
        this.loadDevices();
        this.loadGroups();
    }

    destroy() {
        this.disconnectWebSocket();
    }
}

// Initialize Sonos section with authentication awareness
document.addEventListener('DOMContentLoaded', () => {
    // Create instance only if it doesn't exist
    if (!window.sonosSection) {
        window.sonosSection = new SonosSection();
    }
});

// Fallback initialization for when the page is already loaded
if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
} else {
    // Document is already loaded, initialize immediately
    if (!window.sonosSection) {
        window.sonosSection = new SonosSection();
    }
}