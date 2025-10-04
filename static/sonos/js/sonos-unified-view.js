/**
 * Sonos Unified View - Manages the unified display of devices and groups
 * with drag-and-drop functionality for group management
 */
class SonosUnifiedView {
    constructor() {
        this.devices = new Map();
        this.groups = new Map();
        this.dragState = null;
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.getElementById('unified-device-list');
        if (!this.container) {
            console.error('Unified device list container not found');
            return;
        }

        this.setupDragAndDrop();
        this.loadInitialData();
        this.setupWebSocket();
        this.setupPeriodicRefresh();
    }

    setupDragAndDrop() {
        this.container.addEventListener('dragstart', (e) => {
            this.handleDragStart(e);
        });

        this.container.addEventListener('dragover', (e) => {
            this.handleDragOver(e);
        });

        this.container.addEventListener('drop', (e) => {
            this.handleDrop(e);
        });

        this.container.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });

        // Touch support for mobile
        this.container.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        });

        this.container.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        });

        this.container.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        });
    }

    handleDragStart(e) {
        const card = e.target.closest('.sonos-card');
        if (!card) {
            e.preventDefault();
            return;
        }

        this.dragState = {
            element: card,
            type: card.classList.contains('group-card') ? 'group' : 'device',
            id: card.dataset.groupId || card.dataset.deviceId
        };

        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dragState.id);

        // Create drag preview
        this.createDragPreview(card);
    }

    handleDragOver(e) {
        e.preventDefault();
        const targetCard = e.target.closest('.sonos-card');
        if (!targetCard || targetCard === this.dragState?.element) return;

        // Highlight valid drop targets
        if (this.isValidDropTarget(targetCard)) {
            targetCard.classList.add('drop-highlight');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const targetCard = e.target.closest('.sonos-card');

        if (!targetCard) {
            return;
        }

        if (!this.isValidDropTarget(targetCard)) {
            return;
        }

        this.performGroupOperation(targetCard);
    }

    handleDragEnd(e) {
        const card = e.target.closest('.sonos-card');
        if (card) {
            card.classList.remove('dragging');
        }

        // Remove all drop highlights
        document.querySelectorAll('.drop-highlight').forEach(el => {
            el.classList.remove('drop-highlight');
        });

        // Remove drag preview
        this.removeDragPreview();

        this.dragState = null;
    }

    handleTouchStart(e) {
        const card = e.target.closest('.sonos-card');
        if (!card) return;

        this.touchState = {
            element: card,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            type: card.classList.contains('group-card') ? 'group' : 'device',
            id: card.dataset.groupId || card.dataset.deviceId
        };
    }

    handleTouchMove(e) {
        if (!this.touchState) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchState.startX;
        const deltaY = touch.clientY - this.touchState.startY;

        // Start drag if moved more than 10px
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.touchState.element.classList.add('dragging');
            this.createDragPreview(this.touchState.element);
        }
    }

    handleTouchEnd(e) {
        if (!this.touchState) return;

        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = targetElement?.closest('.sonos-card');

        if (targetCard && this.isValidDropTarget(targetCard)) {
            this.performGroupOperation(targetCard);
        }

        this.touchState.element.classList.remove('dragging');
        this.removeDragPreview();
        this.touchState = null;
    }

    isValidDropTarget(targetCard) {
        if (!this.dragState && !this.touchState) {
            return false;
        }

        const dragState = this.dragState || this.touchState;

        // Can't drop on self
        if (targetCard === dragState.element) {
            return false;
        }

        // Can drop individual devices on groups or other devices
        if (dragState.type === 'device') {
            return true;
        }

        // Can drop groups on other groups (merge groups) OR on individual devices (create new group)
        if (dragState.type === 'group') {
            const isGroupCard = targetCard.classList.contains('group-card');
            const isDeviceCard = targetCard.classList.contains('device-card');
            return isGroupCard || isDeviceCard;
        }

        return false;
    }

    async performGroupOperation(targetCard) {
        const targetId = targetCard.dataset.groupId || targetCard.dataset.deviceId;
        const targetIsGroup = targetCard.classList.contains('group-card');

        const dragState = this.dragState || this.touchState;

        try {
            if (dragState.type === 'device') {
                if (targetIsGroup) {
                    // Add device to existing group
                    await this.addDeviceToGroup(dragState.id, targetId);
                } else {
                    // Create new group with both devices
                    await this.createGroupWithDevices(targetId, [dragState.id]);
                }
            } else if (dragState.type === 'group') {
                if (targetIsGroup) {
                    // Merge groups
                    await this.mergeGroups(dragState.id, targetId);
                } else {
                    // Group dropped on individual device - create new group with device as coordinator
                    await this.createGroupFromGroupAndDevice(dragState.id, targetId);
                }
            }

            // Wait a moment for the backend to process the changes
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Refresh the view
            await this.refreshView();

            // Show success message
            this.showSuccess('Group updated successfully!');

        } catch (error) {
            console.error('Group operation failed:', error);
            this.showError('Failed to update group: ' + error.message);
        }
    }

    async addDeviceToGroup(deviceId, groupId) {
        const response = await fetch(`/api/sonos/groups/${groupId}/join/${deviceId}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
    }

    async createGroupWithDevices(coordinatorId, memberIds) {
        const response = await fetch('/api/sonos/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinator: coordinatorId,
                members: memberIds
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
    }

    async mergeGroups(sourceGroupId, targetGroupId) {
        // Get source group members
        const sourceGroup = this.groups.get(sourceGroupId);
        if (!sourceGroup) {
            return;
        }

        // Add all source group members to target group
        for (const member of sourceGroup.members) {
            // member is a device object, we need the UUID
            const deviceId = member.uuid || member.id;
            await this.addDeviceToGroup(deviceId, targetGroupId);
        }

        // Source group will be automatically dissolved when empty
    }

    async createGroupFromGroupAndDevice(sourceGroupId, targetDeviceId) {
        // Get source group members
        const sourceGroup = this.groups.get(sourceGroupId);
        if (!sourceGroup) {
            return;
        }

        // Get target device name
        const targetDevice = this.devices.get(targetDeviceId);
        if (!targetDevice) {
            return;
        }

        // Get all device names from the source group (including coordinator)
        const allDeviceNames = sourceGroup.members.map(member => {
            const device = this.devices.get(member.uuid || member.id);
            return device ? device.name : null;
        }).filter(name => name !== null);

        // Create new group with target device as coordinator and all source group members
        const response = await fetch('/api/sonos/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinator: targetDevice.name,
                members: [targetDevice.name, ...allDeviceNames] // Include target device and all source group members
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const newGroup = await response.json();

        // The group ID is the coordinator's UUID (targetDeviceId)
        const groupId = targetDeviceId;

        // No need to add members individually since they were included in the initial request
    }

    async refreshView() {
        try {
            console.log('[UNIFIED REFRESH DEBUG] Starting unified view refresh...');

            // Always fetch fresh data from API to ensure we get the latest state
            console.log('[UNIFIED REFRESH DEBUG] Fetching devices and groups from API...');
            const [devicesResponse, groupsResponse] = await Promise.all([
                fetch('/api/sonos/devices'),
                fetch('/api/sonos/groups')
            ]);

            console.log('[UNIFIED REFRESH DEBUG] Devices response status:', devicesResponse.status);
            console.log('[UNIFIED REFRESH DEBUG] Groups response status:', groupsResponse.status);

            if (!devicesResponse.ok || !groupsResponse.ok) {
                throw new Error('Failed to fetch data from API');
            }

            const devices = await devicesResponse.json();
            const groups = await groupsResponse.json();

            console.log('[UNIFIED REFRESH DEBUG] Raw devices response:', devices);
            console.log('[UNIFIED REFRESH DEBUG] Raw groups response:', groups);

            // Handle different response formats
            let devicesArray = [];
            let groupsArray = [];

            if (Array.isArray(devices)) {
                devicesArray = devices;
            } else if (devices && typeof devices === 'object') {
                if (devices.devices && Array.isArray(devices.devices)) {
                    devicesArray = devices.devices;
                } else if (devices.data && Array.isArray(devices.data)) {
                    devicesArray = devices.data;
                } else {
                    devicesArray = Object.values(devices);
                }
            }

            if (Array.isArray(groups)) {
                groupsArray = groups;
            } else if (groups && typeof groups === 'object') {
                if (groups.groups && Array.isArray(groups.groups)) {
                    groupsArray = groups.groups;
                } else if (groups.data && Array.isArray(groups.data)) {
                    groupsArray = groups.data;
                } else {
                    groupsArray = Object.values(groups);
                }
            }

            console.log('[UNIFIED REFRESH DEBUG] Processed devices array:', devicesArray.length, 'items');
            console.log('[UNIFIED REFRESH DEBUG] Processed groups array:', groupsArray.length, 'items');

            this.updateView(devicesArray, groupsArray);
            console.log('[UNIFIED REFRESH DEBUG] View updated successfully');

            // Also update the main dashboard data if it exists
            if (window.sonosDashboard) {
                console.log('[UNIFIED REFRESH DEBUG] Updating main dashboard data');
                window.sonosDashboard.devices = devicesArray;
                window.sonosDashboard.groups = groupsArray;
            } else {
                console.log('[UNIFIED REFRESH DEBUG] No main dashboard found to update');
            }
        } catch (error) {
            console.error('[UNIFIED REFRESH DEBUG] Failed to refresh view:', error);
            this.showError('Failed to refresh device list');
        }
    }

    showMockData() {
        const mockDevices = [
            {
                uuid: 'device-1',
                name: 'Living Room',
                playback_state: 'STOPPED',
                volume: 50,
                current_track: null,
                group_id: null
            },
            {
                uuid: 'device-2',
                name: 'Kitchen',
                playback_state: 'PLAYING',
                volume: 75,
                current_track: { title: 'Test Song', artist: 'Test Artist' },
                group_id: 'group-1'
            },
            {
                uuid: 'device-3',
                name: 'Office',
                playback_state: 'PAUSED',
                volume: 30,
                current_track: null,
                group_id: 'group-1'
            }
        ];

        const mockGroups = [
            {
                id: 'group-1',
                coordinator: { name: 'Kitchen', uuid: 'device-2' },
                members: [
                    { name: 'Kitchen', uuid: 'device-2' },
                    { name: 'Office', uuid: 'device-3' }
                ],
                playback_state: 'PLAYING',
                volume: 75,
                current_track: { title: 'Test Song', artist: 'Test Artist' }
            }
        ];

        this.updateView(mockDevices, mockGroups);
    }

    updateView(devices, groups) {
        console.log('[UPDATE VIEW DEBUG] Updating view with devices:', devices.length, 'groups:', groups.length);

        // Update internal maps
        this.devices.clear();
        this.groups.clear();

        devices.forEach(device => {
            this.devices.set(device.uuid, device);
        });

        groups.forEach(group => {
            this.groups.set(group.id, group);
        });

        // Create unified list of items to display
        const items = this.createUnifiedItems(devices, groups);
        console.log('[UPDATE VIEW DEBUG] Created unified items:', items.length);

        // Clear container
        this.container.innerHTML = '';

        if (items.length === 0) {
            console.log('[UPDATE VIEW DEBUG] No items to display, showing empty state');
            this.showEmptyState();
            return;
        }

        // Add items to container
        items.forEach((item, index) => {
            const card = this.createCard(item);
            this.container.appendChild(card);
        });

        console.log('[UPDATE VIEW DEBUG] Rendered', items.length, 'items successfully');
    }

    createUnifiedItems(devices, groups) {
        console.log('[CREATE UNIFIED DEBUG] Creating unified items from', devices.length, 'devices and', groups.length, 'groups');
        const items = [];

        // Add groups first (sorted alphabetically by coordinator name)
        const sortedGroups = [...groups].sort((a, b) => {
            const nameA = a.coordinator?.name || '';
            const nameB = b.coordinator?.name || '';
            return nameA.localeCompare(nameB);
        });

        sortedGroups.forEach((group, index) => {
            items.push({
                type: 'group',
                id: group.id,
                coordinator: group.coordinator,
                members: group.members,
                status: group.state || group.playback_state,
                volume: group.volume,
                currentTrack: group.current_track
            });
        });

        // Add individual devices (not in any group) - sorted alphabetically by name
        const individualDevices = devices.filter(device => !device.group_id);
        const sortedDevices = individualDevices.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });

        sortedDevices.forEach((device, index) => {
            items.push({
                type: 'device',
                id: device.uuid,
                name: device.name,
                status: device.state || device.playback_state,
                volume: device.volume,
                currentTrack: device.current_track
            });
        });

        console.log('[CREATE UNIFIED DEBUG] Created', items.length, 'unified items');
        return items;
    }

    createCard(item) {
        const card = document.createElement('div');
        card.className = `sonos-card ${item.type}-card`;
        card.draggable = true;
        card.dataset[`${item.type}Id`] = item.id;

        if (item.type === 'group') {
            card.innerHTML = this.createGroupCardHTML(item);
        } else {
            card.innerHTML = this.createDeviceCardHTML(item);
        }

        return card;
    }

    createGroupCardHTML(group) {
        return `
            <div class="coordinator">
                <div class="device-info">
                    <span class="device-name">${group.coordinator.name}</span>
                    <span class="device-status">${this.getTrackInfo(group.currentTrack, group.status) || '[No music selected]'}</span>
                </div>
                <div class="device-controls">
                    <button class="control-btn play" onclick="sonosUnifiedView.playGroup('${group.id}')">▶️</button>
                    <button class="control-btn pause" onclick="sonosUnifiedView.pauseGroup('${group.id}')">⏸️</button>
                    <button class="control-btn stop" onclick="sonosUnifiedView.stopGroup('${group.id}')">⏹️</button>
                    <div class="volume-control">
                        <input type="range" min="0" max="100" value="${group.volume}" 
                               onchange="sonosUnifiedView.setGroupVolume('${group.id}', this.value)">
                        <span class="volume-display">${group.volume}%</span>
                    </div>
                </div>
            </div>
            <div class="group-members">
                ${group.members.filter(member => member.uuid !== group.coordinator?.uuid).map(member => `
                    <div class="member-device" data-device-id="${member.uuid}">
                        <span class="member-name">${member.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
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

    createDeviceCardHTML(device) {
        return `
            <div class="device-info">
                <span class="device-name">${device.name}</span>
                <span class="device-status">${this.getTrackInfo(device.currentTrack, device.status) || '[No music selected]'}</span>
            </div>
            <div class="device-controls">
        <button class="control-btn play" onclick="sonosUnifiedView.playDevice('${device.id}')">▶️</button>
        <button class="control-btn pause" onclick="sonosUnifiedView.pauseDevice('${device.id}')">⏸️</button>
        <button class="control-btn stop" onclick="sonosUnifiedView.stopDevice('${device.id}')">⏹️</button>
        <div class="volume-control">
            <input type="range" min="0" max="100" value="${device.volume}" 
                   onchange="sonosUnifiedView.setDeviceVolume('${device.id}', this.value)">
            <span class="volume-display">${device.volume}%</span>
        </div>
            </div>
        `;
    }

    createDragPreview(card) {
        const preview = card.cloneNode(true);
        preview.classList.add('drag-preview');
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '1000';
        preview.style.opacity = '0.8';
        preview.style.transform = 'rotate(5deg)';

        document.body.appendChild(preview);
        this.dragPreview = preview;
    }

    removeDragPreview() {
        if (this.dragPreview) {
            document.body.removeChild(this.dragPreview);
            this.dragPreview = null;
        }
    }

    async loadInitialData() {
        try {
            console.log('[INITIAL LOAD DEBUG] Fetching initial Sonos data from API...');
            // Fetch fresh data directly from API to get current track information
            const [devicesResponse, groupsResponse] = await Promise.all([
                fetch('/api/sonos/devices'),
                fetch('/api/sonos/groups')
            ]);

            console.log('[INITIAL LOAD DEBUG] Devices response status:', devicesResponse.status);
            console.log('[INITIAL LOAD DEBUG] Groups response status:', groupsResponse.status);

            if (!devicesResponse.ok || !groupsResponse.ok) {
                throw new Error('Failed to fetch data from API');
            }

            const devicesData = await devicesResponse.json();
            const groupsData = await groupsResponse.json();

            console.log('[INITIAL LOAD DEBUG] Raw API responses received');

            // Extract the actual arrays from the API response
            const devices = devicesData.devices || [];
            const groups = groupsData.groups || [];

            console.log('[INITIAL LOAD DEBUG] Extracted', devices.length, 'devices and', groups.length, 'groups');
            this.updateView(devices, groups);
        } catch (error) {
            console.error('[INITIAL LOAD DEBUG] Failed to load initial data:', error);
            this.showError('Failed to load devices and groups');

            // Show empty state if API is not available
            this.showEmptyState();
        }
    }

    showEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <h3>No Sonos devices found</h3>
                <p>Make sure your Sonos devices are connected and the Jishi API is running.</p>
                <button onclick="sonosUnifiedView.refreshView()" class="action-btn">Retry</button>
            </div>
        `;
    }

    setupWebSocket() {
        // WebSocket integration will be handled by the main dashboard
        // This method is a placeholder for future WebSocket updates
    }

    setupPeriodicRefresh() {
        // Refresh data every 20 seconds to get current track information
        setInterval(() => {
            this.loadInitialData();
        }, 20000);
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Public methods for external control
    async playGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/play`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to play group');
            }
        } catch (error) {
            console.error('Failed to play group:', error);
            this.showError('Failed to play group');
        }
    }

    async pauseGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/pause`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to pause group');
            }
        } catch (error) {
            console.error('Failed to pause group:', error);
            this.showError('Failed to pause group');
        }
    }

    async stopGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/stop`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to stop group');
            }
        } catch (error) {
            console.error('Failed to stop group:', error);
            this.showError('Failed to stop group');
        }
    }

    async setGroupVolume(groupId, volume) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/volume/${volume}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to set group volume');
            }
        } catch (error) {
            console.error('Failed to set group volume:', error);
            this.showError('Failed to set group volume');
        }
    }

    async playDevice(deviceId) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/play`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to play device');
            }
        } catch (error) {
            console.error('Failed to play device:', error);
            this.showError('Failed to play device');
        }
    }

    async pauseDevice(deviceId) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/pause`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to pause device');
            }
        } catch (error) {
            console.error('Failed to pause device:', error);
            this.showError('Failed to pause device');
        }
    }

    async stopDevice(deviceId) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/stop`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to stop device');
            }
        } catch (error) {
            console.error('Failed to stop device:', error);
            this.showError('Failed to stop device');
        }
    }

    async setDeviceVolume(deviceId, volume) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceId}/volume/${volume}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to set device volume');
            }
        } catch (error) {
            console.error('Failed to set device volume:', error);
            this.showError('Failed to set device volume');
        }
    }
}

// Initialize unified view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sonosUnifiedView = new SonosUnifiedView();
});
