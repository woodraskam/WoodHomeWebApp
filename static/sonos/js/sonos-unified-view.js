/**
 * Sonos Unified View - Manages the unified display of devices and groups
 * with group management functionality
 */
class SonosUnifiedView {
    constructor() {
        this.devices = new Map();
        this.groups = new Map();
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.getElementById('unified-device-list');
        if (!this.container) {
            console.error('Unified device list container not found');
            return;
        }

        this.loadInitialData();
        this.setupWebSocket();
        this.setupPeriodicRefresh();
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

    isActiveGroup(group) {
        // Simple check: A group is active if it has multiple different devices
        if (!group || !group.members || group.members.length < 2) {
            return false;
        }

        if (!group.coordinator || !group.coordinator.uuid) {
            return false;
        }

        // Check if there are actual other members (not just the coordinator)
        const coordinatorUUID = group.coordinator.uuid;
        const hasOtherMembers = group.members.some(member =>
            member && member.uuid && member.uuid !== coordinatorUUID
        );

        return hasOtherMembers;
    }

    createUnifiedItems(devices, groups) {
        console.log('[REBUILD DEBUG] Creating unified items from', devices.length, 'devices and', groups.length, 'groups');

        const items = [];

        // Step 1: Process groups - only show groups that are actually active in Sonos
        const activeGroups = groups.filter(group => this.isActiveGroup(group));
        console.log(`[REBUILD DEBUG] Found ${activeGroups.length} active groups out of ${groups.length} total`);

        // Add active groups to items (sorted alphabetically by coordinator name)
        const sortedGroups = [...activeGroups].sort((a, b) => {
            const nameA = a.coordinator?.name || '';
            const nameB = b.coordinator?.name || '';
            return nameA.localeCompare(nameB);
        });

        sortedGroups.forEach(group => {
            console.log(`[REBUILD DEBUG] Adding group: ${group.coordinator?.name} with ${group.members?.length || 0} members`);
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

        // Step 2: Find devices that are NOT in any active group
        const devicesInActiveGroups = new Set();
        activeGroups.forEach(group => {
            // Add coordinator
            if (group.coordinator?.uuid) {
                devicesInActiveGroups.add(group.coordinator.uuid);
            }
            // Add members
            if (group.members) {
                group.members.forEach(member => {
                    if (member.uuid) {
                        devicesInActiveGroups.add(member.uuid);
                    }
                });
            }
        });

        console.log(`[REBUILD DEBUG] Devices in active groups: ${Array.from(devicesInActiveGroups).length}`);

        // Step 3: Add individual devices (not in any active group) - sorted alphabetically
        const individualDevices = devices.filter(device =>
            !devicesInActiveGroups.has(device.uuid)
        );

        // Sort individual devices alphabetically by name
        const sortedDevices = individualDevices.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });

        console.log(`[REBUILD DEBUG] Individual devices: ${sortedDevices.length}`);
        sortedDevices.forEach(device => {
            console.log(`[REBUILD DEBUG] Adding individual device: ${device.name}`);
            items.push({
                type: 'device',
                id: device.uuid,
                name: device.name,
                status: device.state || device.playback_state,
                volume: device.volume,
                currentTrack: device.current_track
            });
        });

        console.log(`[REBUILD DEBUG] Created ${items.length} total items (${items.filter(i => i.type === 'group').length} groups, ${items.filter(i => i.type === 'device').length} devices)`);
        return items;
    }

    createCard(item) {
        const card = document.createElement('div');
        card.className = `sonos-card ${item.type}-card`;
        card.dataset[`${item.type}Id`] = item.id;

        if (item.type === 'group') {
            card.innerHTML = this.createGroupCardHTML(item);
        } else {
            card.innerHTML = this.createDeviceCardHTML(item);
        }

        return card;
    }

    createGroupCardHTML(group) {
        const albumArt = this.getAlbumArtHTML(group.currentTrack);
        return `
            <div class="coordinator">
                <div class="device-info">
                    <span class="device-name">${group.coordinator.name}</span>
                    <span class="device-status">${this.getTrackInfo(group.currentTrack, group.status) || '[No music selected]'}</span>
                </div>
            </div>
            <div class="volume-control-full">
                <input type="range" min="0" max="100" value="${group.volume}" 
                       onchange="sonosUnifiedView.setGroupVolume('${group.id}', this.value)"
                       class="volume-slider-full">
                <span class="volume-display">${group.volume}%</span>
            </div>
            ${albumArt}
            <div class="group-members">
                ${group.members.filter(member => member.uuid !== group.coordinator?.uuid).map(member => `
                    <div class="member-device" data-device-id="${member.uuid}">
                        <span class="member-name">${member.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="device-controls-bottom">
                <button class="control-btn play" onclick="sonosUnifiedView.playGroup('${group.id}')">
                    <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button class="control-btn pause" onclick="sonosUnifiedView.pauseGroup('${group.id}')">
                    <span class="material-symbols-outlined">pause</span>
                </button>
                <button class="control-btn stop" onclick="sonosUnifiedView.stopGroup('${group.id}')">
                    <span class="material-symbols-outlined">stop</span>
                </button>
            </div>
        `;
    }

    getTrackInfo(currentTrack) {
        if (!currentTrack) return null;

        // Debug: Log all track info for troubleshooting
        console.log('[TRACK DEBUG] Processing track:', {
            uri: currentTrack.uri,
            type: currentTrack.type,
            title: currentTrack.title,
            artist: currentTrack.artist
        });

        // Check for TV/SPDIF input (HDMI ARC) - prioritize this check
        if (currentTrack.uri && (currentTrack.uri.includes('spdif') || currentTrack.uri.includes('htastream'))) {
            console.log('[SPDIF DEBUG] Detected TV audio:', {
                uri: currentTrack.uri,
                type: currentTrack.type,
                title: currentTrack.title
            });
            return 'TV';
        }

        // Check for other line input types
        if (currentTrack.type === 'line_in' && currentTrack.uri) {
            if (currentTrack.uri.includes('htastream')) {
                console.log('[LINE INPUT DEBUG] Detected TV audio via line_in:', currentTrack.uri);
                return 'TV';
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

    getAlbumArtHTML(currentTrack) {
        if (!currentTrack || !currentTrack.art) {
            return '';
        }

        // Handle different album art URI formats
        let albumArtUrl = currentTrack.art;

        // If it's a relative URL, make it absolute to the Jishi API
        if (albumArtUrl.startsWith('/')) {
            // Get the base URL for the Jishi API (typically running on port 5005)
            const jishiBaseUrl = window.location.protocol + '//' + window.location.hostname + ':5005';
            albumArtUrl = jishiBaseUrl + albumArtUrl;
        }

        return `
            <div class="album-art-container">
                <img src="${albumArtUrl}" 
                     alt="Album Art" 
                     class="album-art"
                     onerror="this.style.display='none'"
                     loading="lazy">
            </div>
        `;
    }

    createDeviceCardHTML(device) {
        const albumArt = this.getAlbumArtHTML(device.currentTrack);
        return `
            <div class="device-info">
                <span class="device-name">${device.name}</span>
                <span class="device-status">${this.getTrackInfo(device.currentTrack, device.status) || '[No music selected]'}</span>
            </div>
            <div class="volume-control-full">
                <input type="range" min="0" max="100" value="${device.volume}" 
                       onchange="sonosUnifiedView.setDeviceVolume('${device.id}', this.value)"
                       class="volume-slider-full">
                <span class="volume-display">${device.volume}%</span>
            </div>
            ${albumArt}
            <div class="device-actions">
                <button class="action-btn add-speaker-btn" 
                        onclick="window.sonosSection.openAddSpeakerDialog('${device.uuid}', '${device.name}')"
                        title="Add Speaker(s)">
                    <span class="material-symbols-outlined">ad_group</span>
                </button>
            </div>
            <div class="device-controls-bottom">
                <button class="control-btn play" onclick="sonosUnifiedView.playDevice('${device.id}')">
                    <span class="material-symbols-outlined">play_arrow</span>
                </button>
                <button class="control-btn pause" onclick="sonosUnifiedView.pauseDevice('${device.id}')">
                    <span class="material-symbols-outlined">pause</span>
                </button>
                <button class="control-btn stop" onclick="sonosUnifiedView.stopDevice('${device.id}')">
                    <span class="material-symbols-outlined">stop</span>
                </button>
            </div>
        `;
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

            // Update specific group card instead of full refresh
            console.log('SonosUnifiedView: Group volume changed successfully, updating specific card');
            setTimeout(() => {
                this.updateSpecificCard('group', groupId);
            }, 500); // Small delay to allow Sonos to update
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

            // Update specific device card instead of full refresh
            console.log('SonosUnifiedView: Device volume changed successfully, updating specific card');
            setTimeout(() => {
                this.updateSpecificCard('device', deviceId);
            }, 500); // Small delay to allow Sonos to update
        } catch (error) {
            console.error('Failed to set device volume:', error);
            this.showError('Failed to set device volume');
        }
    }

    async updateSpecificCard(type, id) {
        try {
            console.log(`[TARGETED UPDATE] Updating ${type} card for ID: ${id}`);

            // First refresh the data from live Sonos state
            if (type === 'group') {
                const refreshResponse = await fetch('/api/sonos/groups/refresh', {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!refreshResponse.ok) {
                    console.warn('[TARGETED UPDATE] Failed to refresh groups, falling back to cached data');
                }
            } else {
                const refreshResponse = await fetch('/api/sonos/devices/refresh', {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!refreshResponse.ok) {
                    console.warn('[TARGETED UPDATE] Failed to refresh devices, falling back to cached data');
                }
            }

            // Now fetch the fresh data
            let freshData;
            if (type === 'group') {
                const response = await fetch('/api/sonos/groups');
                if (!response.ok) throw new Error('Failed to fetch groups');
                const data = await response.json();
                freshData = data.groups.find(group => group.id === id);
            } else {
                const response = await fetch('/api/sonos/devices');
                if (!response.ok) throw new Error('Failed to fetch devices');
                const data = await response.json();
                freshData = data.devices.find(device => device.uuid === id);
            }

            if (!freshData) {
                console.warn(`[TARGETED UPDATE] ${type} with ID ${id} not found in fresh data`);
                return;
            }

            // Find the existing card in the DOM
            const existingCard = this.container.querySelector(`[data-${type}-id="${id}"]`);
            if (!existingCard) {
                console.warn(`[TARGETED UPDATE] Card for ${type} ${id} not found in DOM`);
                return;
            }

            // Create unified item from fresh data
            let unifiedItem;
            if (type === 'group') {
                unifiedItem = {
                    type: 'group',
                    id: freshData.id,
                    coordinator: freshData.coordinator,
                    members: freshData.members,
                    status: freshData.state || freshData.playback_state,
                    volume: freshData.volume,
                    currentTrack: freshData.current_track
                };
            } else {
                unifiedItem = {
                    type: 'device',
                    id: freshData.uuid,
                    name: freshData.name,
                    status: freshData.state || freshData.playback_state,
                    volume: freshData.volume,
                    currentTrack: freshData.current_track
                };
            }

            // Create new card with fresh data
            const newCard = this.createCard(unifiedItem);

            // Replace the existing card with the new one
            existingCard.parentNode.replaceChild(newCard, existingCard);

            console.log(`[TARGETED UPDATE] Successfully updated ${type} card for ${id}`);

        } catch (error) {
            console.error(`[TARGETED UPDATE] Failed to update ${type} card:`, error);
            // Fallback to full refresh if targeted update fails
            console.log('[TARGETED UPDATE] Falling back to full refresh');
            if (window.sonosSection && window.sonosSection.forceRefresh) {
                window.sonosSection.forceRefresh();
            }
        }
    }
}

// Initialize unified view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sonosUnifiedView = new SonosUnifiedView();
});
