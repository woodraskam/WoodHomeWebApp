/**
 * Sonos Audio Section - SPA Compatible
 * Full Sonos integration with WebSocket support
 */
class SonosSection {
    constructor() {
        console.log('SonosSection constructor called');
        this.name = 'sonos';
        this.isActive = false;
        this.devices = [];
        this.groups = [];
        this.websocket = null;
        this.isConnected = false;
        this.isLoaded = false;
    }

    init() {
        console.log('SonosSection init() called');
        this.setupEventListeners();
        this.createSonosSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            if (e.detail.section === 'sonos') {
                this.load();
            }
        });

        document.addEventListener('sectionload', (e) => {
            console.log('Section load event:', e.detail.section);
            if (e.detail.section === 'sonos') {
                console.log('Loading Sonos section');
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            console.log('Section change event:', e.detail.section);
            if (e.detail.section === 'sonos') {
                console.log('Switching to Sonos section');
                this.show();
                this.connectWebSocket();
            } else {
                console.log('Leaving Sonos section');
                this.hide();
                this.disconnectWebSocket();
            }
        });
    }

    createSonosSection() {
        console.log('Creating Sonos section...');
        const contentArea = document.getElementById('main-content');
        if (!contentArea) {
            console.error('Main content area not found!');
            return;
        }
        console.log('Main content area found');

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
        console.log('Sonos section load() called');
        if (!this.isLoaded) {
            console.log('Sonos section initializing...');
            this.isLoaded = true;
            this.setupSonosEventListeners();
            // Load both devices and groups, then render unified view
            this.loadUnifiedData();
        }
        this.show();
    }

    async loadUnifiedData() {
        console.log('Loading unified Sonos data...');
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
                console.log('[UNIFIED LOAD] Devices loaded:', this.devices.length);
            } else {
                console.error('[UNIFIED LOAD] Failed to load devices');
                this.devices = [];
            }

            // Process groups
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                this.groups = groupsData.groups || [];
                console.log('[UNIFIED LOAD] Groups loaded:', this.groups.length);
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
                    console.log('Sonos WebSocket connection timeout');
                    this.websocket.close();
                    this.updateConnectionStatus('offline');
                }
            }, 5000);

            this.websocket.onopen = () => {
                clearTimeout(timeout);
                console.log('Sonos WebSocket connected');
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
                console.log('Sonos WebSocket disconnected');
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
            console.log('Device updated via WebSocket:', deviceData.name, 'volume:', deviceData.volume);
        }
    }

    updateGroup(groupData) {
        // Update group in local array
        const groupIndex = this.groups.findIndex(g => g.id === groupData.id);
        if (groupIndex !== -1) {
            this.groups[groupIndex] = { ...this.groups[groupIndex], ...groupData };
            console.log('Group updated via WebSocket:', groupData.coordinator?.name, 'volume:', groupData.volume);
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
            console.log('[LOAD DEVICES DEBUG] Fetching devices from API...');
            const response = await fetch('/api/sonos/devices');
            console.log('[LOAD DEVICES DEBUG] Response status:', response.status);

            const data = await response.json();
            console.log('[LOAD DEVICES DEBUG] Response data:', data);

            if (response.ok) {
                this.devices = data.devices || [];
                console.log('[LOAD DEVICES DEBUG] Devices loaded:', this.devices.length);
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
            console.log('[LOAD GROUPS DEBUG] Fetching groups from API...');
            const response = await fetch('/api/sonos/groups');
            console.log('[LOAD GROUPS DEBUG] Response status:', response.status);

            const data = await response.json();
            console.log('[LOAD GROUPS DEBUG] Response data:', data);

            if (response.ok) {
                this.groups = data.groups || [];
                console.log('[LOAD GROUPS DEBUG] Groups loaded:', this.groups.length);
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
        console.log('showDemoContent() called - setting up demo devices'); // Debug
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

        console.log('Demo devices set:', this.devices); // Debug
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

        console.log('Rendering unified view with devices:', this.devices, 'and groups:', this.groups);

        // Create unified items (groups first, then individual devices)
        const unifiedItems = this.createUnifiedItems();

        grid.innerHTML = unifiedItems.map(item => {
            if (item.type === 'group') {
                return this.createGroupCardHTML(item);
            } else {
                return this.createDeviceCardHTML(item);
            }
        }).join('');

        // Initialize M3 sliders after rendering
        this.initializeM3Sliders();
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
                </div>
                <div class="m3-card-content">
                    <div class="coordinator">
                        <div class="device-info">
                            <p><strong>Coordinator:</strong> ${group.coordinator.name}</p>
                            <p><strong>Status:</strong> ${group.status || 'STOPPED'}</p>
                            <p><strong>Volume:</strong> ${group.volume || 0}%</p>
                            <p><strong>Track:</strong> ${this.getTrackInfo(group.currentTrack) || '[No music selected]'}</p>
                        </div>
                        <div class="device-controls">
                            <button class="m3-button m3-button-text" onclick="window.sonosSection.toggleGroupPlayPause('${group.id}')">
                                <span class="material-symbols-outlined interactive play-button">${group.status === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                            </button>
                            <button class="m3-button m3-button-text" onclick="window.sonosSection.stopGroup('${group.id}')">
                                <span class="material-symbols-outlined interactive">stop</span>
                            </button>
                            <div class="volume-control">
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
                    </div>
                    <div class="group-members">
                        <h5>Group Members:</h5>
                        ${group.members.filter(member => member.uuid !== group.coordinator?.uuid).map(member => `
                            <div class="member-device" data-device-id="${member.uuid}">
                                <span class="material-symbols-outlined small">speaker</span>
                                <span class="member-name">${member.name}</span>
                            </div>
                        `).join('')}
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
                </div>
                <div class="m3-card-content">
                    <div class="device-info">
                        <p><strong>Room:</strong> ${device.room}</p>
                        <p><strong>Status:</strong> ${device.status}</p>
                        <p><strong>Volume:</strong> ${device.volume}%</p>
                        <p><strong>Track:</strong> ${this.getTrackInfo(device.currentTrack) || '[No music selected]'}</p>
                    </div>
                    <div class="device-controls">
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.togglePlayPause('${device.id}')">
                            <span class="material-symbols-outlined interactive play-button">${device.status === 'PLAYING' ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button class="m3-button m3-button-text" onclick="window.sonosSection.stopDevice('${device.id}')">
                            <span class="material-symbols-outlined interactive">stop</span>
                        </button>
                        <div class="volume-control">
                            <span class="material-symbols-outlined volume-icon">volume_up</span>
                            <input type="range" min="0" max="100" value="${device.volume}" 
                                   class="m3-slider" data-device-id="${device.id}"
                                   oninput="window.sonosSection.updateSliderProgress(this); window.sonosSection.updateVolumeDisplay('${device.id}', this.value)"
                                   onchange="window.sonosSection.setVolume('${device.id}', this.value)"
                                   onmouseup="window.sonosSection.setVolume('${device.id}', this.value)"
                                   ontouchend="window.sonosSection.setVolume('${device.id}', this.value)">
                            <span class="volume-display">${device.volume}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // M3 Slider Progress Update
    updateSliderProgress(slider) {
        const progress = (slider.value / slider.max) * 100;
        slider.style.setProperty('--slider-progress', `${progress}%`);
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


    // Device control methods
    async togglePlayPause(deviceId) {
        // Handle demo mode
        if (deviceId && deviceId.startsWith('demo-')) {
            console.log(`Demo mode: Toggling playback for ${deviceId}`);
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
            console.log(`Demo mode: Stopping ${deviceId}`);
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
        console.log('setVolume called with deviceId:', deviceId, 'volume:', volume); // Debug

        // Handle demo mode
        if (deviceId && deviceId.startsWith('demo-')) {
            console.log(`Demo mode: Setting volume for ${deviceId} to ${volume}%`);
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
                console.log('Volume updated successfully to:', volume);
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
                console.log('Group volume updated successfully to:', volume);
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
        console.log('Sonos section destroyed');
    }
}

// Initialize Sonos section immediately
console.log('Initializing Sonos section...');
window.sonosSection = new SonosSection();
window.sonosSection.init();