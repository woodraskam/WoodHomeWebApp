// Sonos Dashboard JavaScript
class SonosDashboard {
    constructor() {
        this.devices = [];
        this.groups = [];
        this.websocket = null;
        this.isConnected = false;
        this.deviceControl = null;
        this.groupManagement = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadDevices();
        this.loadGroups();
        
        // Initialize sub-modules
        this.deviceControl = new SonosDeviceControl(this);
        this.groupManagement = new SonosGroupManagement(this);
        
        this.deviceControl.init();
        this.groupManagement.init();
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('play-all')?.addEventListener('click', () => this.playAllDevices());
        document.getElementById('pause-all')?.addEventListener('click', () => this.pauseAllDevices());
        document.getElementById('stop-all')?.addEventListener('click', () => this.stopAllDevices());
        document.getElementById('refresh-devices')?.addEventListener('click', () => this.refreshDevices());
        
        // Group management button
        const createGroupBtn = document.createElement('button');
        createGroupBtn.id = 'create-group';
        createGroupBtn.className = 'action-btn create-btn';
        createGroupBtn.textContent = 'Create Group';
        createGroupBtn.addEventListener('click', () => this.groupManagement.openGroupModal());
        
        // Add to quick actions if it doesn't exist
        const quickActions = document.querySelector('.quick-actions');
        if (quickActions && !document.getElementById('create-group')) {
            quickActions.appendChild(createGroupBtn);
        }

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sonos`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.updateConnectionStatus(true);
        };
        
        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'device_update':
                this.updateDevice(data.device);
                break;
            case 'group_update':
                this.updateGroup(data.group);
                break;
            case 'device_list':
                this.devices = data.devices;
                this.renderDevices();
                break;
            case 'group_list':
                this.groups = data.groups;
                this.renderGroups();
                break;
        }
    }

    async loadDevices() {
        try {
            const response = await fetch('/api/sonos/devices');
            const data = await response.json();
            
            if (response.ok) {
                this.devices = data.devices;
                this.renderDevices();
                this.updateDeviceCount();
            } else {
                console.error('Failed to load devices:', data);
            }
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    }

    async loadGroups() {
        try {
            const response = await fetch('/api/sonos/groups');
            const data = await response.json();
            
            if (response.ok) {
                this.groups = data.groups;
                this.renderGroups();
            } else {
                console.error('Failed to load groups:', data);
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    renderDevices() {
        const deviceGrid = document.getElementById('device-grid');
        if (!deviceGrid) return;

        if (this.devices.length === 0) {
            deviceGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No devices found</h3>
                    <p>Make sure your Sonos devices are connected to the network.</p>
                </div>
            `;
            return;
        }

        deviceGrid.innerHTML = this.devices.map(device => this.createDeviceCard(device)).join('');
        
        // Add event listeners to device cards
        deviceGrid.querySelectorAll('.device-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.control-btn')) {
                    const deviceUuid = card.dataset.deviceId;
                    const device = this.devices.find(d => d.uuid === deviceUuid);
                    if (device) {
                        this.deviceControl.openDeviceModal(device);
                    }
                }
            });
        });
    }

    createDeviceCard(device) {
        const statusClass = device.is_online ? 'online' : 'offline';
        const statusText = device.is_online ? 'Online' : 'Offline';
        const playbackStatus = device.state || 'STOPPED';
        
        return `
            <div class="device-card ${statusClass}" data-device-id="${device.uuid}">
                <div class="device-header">
                    <h3 class="device-name">${device.name}</h3>
                    <span class="device-status ${playbackStatus.toLowerCase()}">${playbackStatus}</span>
                </div>
                <div class="device-info">
                    <div class="device-room">${device.room}</div>
                    <div class="device-model">${device.model || 'Sonos'}</div>
                </div>
                <div class="device-controls">
                    <button class="control-btn play" onclick="sonosDashboard.deviceControl.playDevice('${device.uuid}')" ${!device.is_online ? 'disabled' : ''}>▶️</button>
                    <button class="control-btn pause" onclick="sonosDashboard.deviceControl.pauseDevice('${device.uuid}')" ${!device.is_online ? 'disabled' : ''}>⏸️</button>
                    <button class="control-btn stop" onclick="sonosDashboard.deviceControl.stopDevice('${device.uuid}')" ${!device.is_online ? 'disabled' : ''}>⏹️</button>
                    <div class="volume-control">
                        <input type="range" class="volume-slider" min="0" max="100" value="${device.volume || 0}" 
                               onchange="sonosDashboard.deviceControl.setVolume('${device.uuid}', this.value)" ${!device.is_online ? 'disabled' : ''}>
                        <span class="volume-display">${device.volume || 0}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderGroups() {
        const groupContainer = document.getElementById('group-container');
        if (!groupContainer) return;

        if (this.groups.length === 0) {
            groupContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No groups found</h3>
                    <p>Create a group to synchronize multiple rooms.</p>
                </div>
            `;
            return;
        }

        groupContainer.innerHTML = this.groups.map(group => this.createGroupCard(group)).join('');
    }

    createGroupCard(group) {
        const memberTags = group.members.map(member => {
            const isCoordinator = member.uuid === group.coordinator?.uuid;
            const tagClass = isCoordinator ? 'coordinator-tag' : 'member-tag';
            return `<span class="${tagClass}">${member.name}</span>`;
        }).join('');

        return `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-header">
                    <h3 class="group-name">Group ${group.id}</h3>
                    <span class="group-status">${group.state || 'STOPPED'}</span>
                </div>
                <div class="group-members">
                    ${memberTags}
                </div>
                <div class="group-actions">
                    <button class="action-btn" onclick="sonosDashboard.groupManagement.playGroup('${group.id}')">▶️ Play</button>
                    <button class="action-btn" onclick="sonosDashboard.groupManagement.pauseGroup('${group.id}')">⏸️ Pause</button>
                    <button class="action-btn" onclick="sonosDashboard.groupManagement.stopGroup('${group.id}')">⏹️ Stop</button>
                    <button class="action-btn danger" onclick="sonosDashboard.groupManagement.dissolveGroup('${group.id}')">🔓 Dissolve</button>
                </div>
            </div>
        `;
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'Online' : 'Offline';
            statusElement.className = `status-indicator ${connected ? 'online' : 'offline'}`;
        }
    }

    updateDeviceCount() {
        const countElement = document.getElementById('device-count');
        if (countElement) {
            const onlineCount = this.devices.filter(d => d.is_online).length;
            countElement.textContent = `${onlineCount}/${this.devices.length} devices`;
        }
    }

    updateDevice(device) {
        const deviceCard = document.querySelector(`[data-device-id="${device.uuid}"]`);
        if (deviceCard) {
            // Update device in array
            const index = this.devices.findIndex(d => d.uuid === device.uuid);
            if (index !== -1) {
                this.devices[index] = device;
            }
            
            // Re-render the specific device card
            deviceCard.outerHTML = this.createDeviceCard(device);
            
            // Update device control modal if it's open for this device
            if (this.deviceControl && this.deviceControl.currentDevice && 
                this.deviceControl.currentDevice.uuid === device.uuid) {
                this.deviceControl.updateDevice(device);
            }
        }
    }

    updateGroup(group) {
        const groupCard = document.querySelector(`[data-group-id="${group.id}"]`);
        if (groupCard) {
            // Update group in array
            const index = this.groups.findIndex(g => g.id === group.id);
            if (index !== -1) {
                this.groups[index] = group;
            }
            
            // Re-render the specific group card
            groupCard.outerHTML = this.createGroupCard(group);
        }
    }

    // Device control methods
    async playDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/play`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to play device');
            }
        } catch (error) {
            console.error('Error playing device:', error);
        }
    }

    async pauseDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/pause`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to pause device');
            }
        } catch (error) {
            console.error('Error pausing device:', error);
        }
    }

    async stopDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/stop`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to stop device');
            }
        } catch (error) {
            console.error('Error stopping device:', error);
        }
    }

    async setVolume(deviceUuid, volume) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/volume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ volume: parseInt(volume) })
            });
            if (!response.ok) {
                throw new Error('Failed to set volume');
            }
        } catch (error) {
            console.error('Error setting volume:', error);
        }
    }

    // Group control methods
    async playGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/play`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to play group');
            }
        } catch (error) {
            console.error('Error playing group:', error);
        }
    }

    async pauseGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/pause`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to pause group');
            }
        } catch (error) {
            console.error('Error pausing group:', error);
        }
    }

    async stopGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/stop`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to stop group');
            }
        } catch (error) {
            console.error('Error stopping group:', error);
        }
    }

    async dissolveGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/dissolve`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to dissolve group');
            }
            this.loadGroups(); // Refresh groups
        } catch (error) {
            console.error('Error dissolving group:', error);
        }
    }

    // Quick actions
    async playAllDevices() {
        for (const device of this.devices) {
            if (device.is_online) {
                await this.playDevice(device.uuid);
            }
        }
    }

    async pauseAllDevices() {
        for (const device of this.devices) {
            if (device.is_online) {
                await this.pauseDevice(device.uuid);
            }
        }
    }

    async stopAllDevices() {
        for (const device of this.devices) {
            if (device.is_online) {
                await this.stopDevice(device.uuid);
            }
        }
    }

    async refreshDevices() {
        await this.loadDevices();
        await this.loadGroups();
    }

    openDeviceModal(device) {
        const modal = document.getElementById('device-modal');
        if (modal) {
            document.getElementById('modal-device-name').textContent = device.name;
            document.getElementById('volume-slider').value = device.volume || 0;
            document.getElementById('volume-display').textContent = `${device.volume || 0}%`;
            modal.style.display = 'block';
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sonosDashboard = new SonosDashboard();
});
