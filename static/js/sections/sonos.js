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
        this.unifiedView = null;

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
                        <button id="create-group" class="md3-btn md3-btn-filled">
                            <span class="material-symbols-outlined">group_add</span>
                            Create Group
                        </button>
                        <button id="refresh-devices" class="md3-btn md3-btn-text">
                            <span class="material-symbols-outlined">refresh</span>
                            Refresh
                        </button>
                    </div>
                        </div>
                    </div>
            <div class="m3-section-content">
                <div class="sonos-unified-view">
                    <div id="unified-device-list" class="device-list">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>Loading Sonos devices...</p>
                        </div>
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
                this.forceRefresh();
            });
        }

        // Create Group button
        const createGroupBtn = document.getElementById('create-group');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', () => {
                console.log('SonosSection: Create Group button clicked');
                this.openGroupDialog();
            });
        }
    }

    async loadData() {
        console.log('SonosSection: loadData() called');
        try {
            await this.loadDevices();
            await this.loadGroups();
            this.initializeUnifiedView();
        } catch (error) {
            console.error('SonosSection: Error loading data:', error);
        }
    }

    async forceRefresh() {
        console.log('SonosSection: forceRefresh() called - forcing fresh data');
        try {
            // Clear any cached data
            this.devices = [];
            this.groups = [];

            // Show loading state
            const container = document.getElementById('unified-device-list');
            if (container) {
                container.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Refreshing Sonos devices...</p>
                    </div>
                `;
            }

            // Force fresh data load
            await this.loadDevices();
            await this.loadGroups();
            this.initializeUnifiedView();

            console.log('SonosSection: Force refresh completed');
        } catch (error) {
            console.error('SonosSection: Error during force refresh:', error);
            // Show error state
            const container = document.getElementById('unified-device-list');
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <p>Failed to load Sonos devices. Please check if the Sonos service is running.</p>
                        <button onclick="window.sonosSection.forceRefresh()" class="md3-btn md3-btn-filled">
                            <span class="material-symbols-outlined">refresh</span>
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    async loadDevices() {
        console.log('SonosSection: Loading devices...');
        try {
            // First, refresh devices from live Sonos data
            console.log('SonosSection: Refreshing devices from live Sonos data...');
            const refreshResponse = await fetch('/api/sonos/devices/refresh', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!refreshResponse.ok) {
                console.warn('SonosSection: Failed to refresh devices, falling back to cached data');
                // Fall back to regular devices endpoint
                const timestamp = Date.now();
                const response = await fetch(`/api/sonos/devices?t=${timestamp}`, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                const data = await response.json();
                this.devices = data.devices || [];
            } else {
                const refreshData = await refreshResponse.json();
                this.devices = refreshData.devices || [];
                console.log('SonosSection: Devices refreshed from live data');
            }

            console.log('SonosSection: Loaded devices:', this.devices.length);
            console.log('SonosSection: Device volumes:', this.devices.map(d => ({ name: d.name, volume: d.volume })));
        } catch (error) {
            console.error('SonosSection: Failed to load devices:', error);
            this.devices = [];
            throw error; // Re-throw to be caught by forceRefresh
        }
    }

    async loadGroups() {
        console.log('SonosSection: Loading groups...');
        try {
            // First, refresh groups from live Sonos data
            console.log('SonosSection: Refreshing groups from live Sonos data...');
            const refreshResponse = await fetch('/api/sonos/groups/refresh', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!refreshResponse.ok) {
                console.warn('SonosSection: Failed to refresh groups, falling back to cached data');
                // Fall back to regular groups endpoint
                const timestamp = Date.now();
                const response = await fetch(`/api/sonos/groups?t=${timestamp}`, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                const data = await response.json();
                this.groups = data.groups || [];
            } else {
                const refreshData = await refreshResponse.json();
                this.groups = refreshData.groups || [];
                console.log('SonosSection: Groups refreshed from live data');
            }

            console.log('SonosSection: Loaded groups:', this.groups.length);
            console.log('SonosSection: Group volumes:', this.groups.map(g => ({ name: g.coordinator?.name, volume: g.volume })));
        } catch (error) {
            console.error('SonosSection: Failed to load groups:', error);
            this.groups = [];
            throw error; // Re-throw to be caught by forceRefresh
        }
    }

    initializeUnifiedView() {
        console.log('SonosSection: Initializing unified view');

        // Update device count
        const deviceCount = document.getElementById('sonos-device-count');
        if (deviceCount) {
            deviceCount.textContent = `${this.devices.length} devices`;
        }

        // Initialize SonosUnifiedView if not already done
        if (!this.unifiedView) {
            this.unifiedView = new SonosUnifiedView();
        }

        // Update the unified view with current data
        console.log('SonosSection: Passing to unified view - devices:', this.devices.length, 'groups:', this.groups.length);
        console.log('SonosSection: Groups data:', this.groups);
        this.unifiedView.updateView(this.devices, this.groups);
    }

    openGroupDialog() {
        console.log('SonosSection: Opening group dialog');

        // Create group dialog if it doesn't exist
        if (!document.getElementById('group-dialog')) {
            this.createGroupDialog();
        }

        // Show dialog
        const dialog = document.getElementById('group-dialog');
        if (dialog) {
            dialog.style.display = 'block';
            this.populateGroupDialog();
        }
    }

    openAddSpeakerDialog(coordinatorUuid, coordinatorName) {
        console.log('SonosSection: Opening add speaker dialog for coordinator:', coordinatorName);

        // Create add speaker dialog if it doesn't exist
        if (!document.getElementById('add-speaker-dialog')) {
            this.createAddSpeakerDialog();
        }

        // Show dialog
        const dialog = document.getElementById('add-speaker-dialog');
        if (dialog) {
            dialog.style.display = 'flex';
            this.populateAddSpeakerDialog(coordinatorUuid, coordinatorName);
        }
    }

    createGroupDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'group-dialog';
        dialog.className = 'md3-dialog-overlay';
        dialog.innerHTML = `
            <div class="md3-dialog">
                <div class="md3-dialog-header">
                    <h3 class="md3-dialog-title">Create Group</h3>
                    <button class="icon-button" onclick="sonosSection.closeGroupDialog()">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="md3-dialog-content">
                    <div class="group-creation">
                        <div class="coordinator-selection">
                            <label for="coordinator-select">Coordinator Room:</label>
                            <select id="coordinator-select" class="md3-select">
                                <option value="">Select coordinator...</option>
                            </select>
                        </div>
                        <div class="member-selection">
                            <label>Member Rooms:</label>
                            <div id="member-checkboxes">
                                <!-- Member checkboxes will be populated -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="md3-dialog-actions">
                    <button id="create-group-btn" class="md3-btn md3-btn-filled">
                        <span class="material-symbols-outlined">group_add</span>
                        Create Group
                    </button>
                    <button id="cancel-group-btn" class="md3-btn md3-btn-outlined" onclick="sonosSection.closeGroupDialog()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('create-group-btn').addEventListener('click', () => {
            this.createGroupFromDialog();
        });
    }

    createAddSpeakerDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'add-speaker-dialog';
        dialog.className = 'md3-dialog-overlay';
        dialog.innerHTML = `
            <div class="md3-dialog">
                <div class="md3-dialog-header">
                    <h3 class="md3-dialog-title">Add Speakers to Group</h3>
                    <button class="icon-button" onclick="sonosSection.closeAddSpeakerDialog()">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="md3-dialog-content">
                    <div class="group-creation">
                        <div class="coordinator-info">
                            <label>Coordinator:</label>
                            <div id="coordinator-name" class="coordinator-display"></div>
                        </div>
                        <div class="member-selection">
                            <label>Add these speakers to the group:</label>
                            <div id="member-checkboxes">
                                <!-- Member checkboxes will be populated -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="md3-dialog-actions">
                    <button id="add-speakers-btn" class="md3-btn md3-btn-filled">
                        <span class="material-symbols-outlined">add</span>
                        Add Speakers
                    </button>
                    <button id="cancel-add-speakers-btn" class="md3-btn md3-btn-outlined" onclick="sonosSection.closeAddSpeakerDialog()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('add-speakers-btn').addEventListener('click', () => {
            this.addSpeakersToGroup();
        });
    }

    populateGroupDialog() {
        // Populate coordinator dropdown
        const coordinatorSelect = document.getElementById('coordinator-select');
        if (coordinatorSelect) {
            coordinatorSelect.innerHTML = '<option value="">Select coordinator...</option>';
            this.devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.name;
                option.textContent = device.name;
                coordinatorSelect.appendChild(option);
            });
        }

        // Populate member checkboxes
        const memberCheckboxes = document.getElementById('member-checkboxes');
        if (memberCheckboxes) {
            memberCheckboxes.innerHTML = '';
            this.devices.forEach(device => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'member-checkbox';
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="member-${device.name}" value="${device.name}">
                    <label for="member-${device.name}">${device.name}</label>
                `;
                memberCheckboxes.appendChild(checkboxDiv);
            });
        }
    }

    populateAddSpeakerDialog(coordinatorUuid, coordinatorName) {
        // Set coordinator name
        const coordinatorDisplay = document.getElementById('coordinator-name');
        if (coordinatorDisplay) {
            coordinatorDisplay.textContent = coordinatorName;
        }

        // Populate member checkboxes (excluding the coordinator)
        const memberCheckboxes = document.getElementById('member-checkboxes');
        if (memberCheckboxes) {
            memberCheckboxes.innerHTML = '';
            this.devices.forEach(device => {
                // Skip the coordinator device
                if (device.uuid === coordinatorUuid) {
                    return;
                }

                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'member-checkbox';
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="add-member-${device.name}" value="${device.name}" data-uuid="${device.uuid}">
                    <label for="add-member-${device.name}">${device.name}</label>
                `;
                memberCheckboxes.appendChild(checkboxDiv);
            });
        }
    }

    async createGroupFromDialog() {
        const coordinatorSelect = document.getElementById('coordinator-select');
        const memberCheckboxes = document.querySelectorAll('#member-checkboxes input[type="checkbox"]:checked');

        if (!coordinatorSelect.value) {
            alert('Please select a coordinator room');
            return;
        }

        const members = Array.from(memberCheckboxes).map(cb => cb.value);
        if (members.length === 0) {
            alert('Please select at least one member room');
            return;
        }

        try {
            const response = await fetch('/api/sonos/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinator: coordinatorSelect.value,
                    members: members
                })
            });

            if (response.ok) {
                console.log('Group created successfully');
                this.closeGroupDialog();
                this.loadData(); // Refresh data
            } else {
                const error = await response.text();
                alert('Failed to create group: ' + error);
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group: ' + error.message);
        }
    }

    closeGroupDialog() {
        const dialog = document.getElementById('group-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    async addSpeakersToGroup() {
        const memberCheckboxes = document.querySelectorAll('#member-checkboxes input[type="checkbox"]:checked');
        const selectedMembers = Array.from(memberCheckboxes).map(checkbox => ({
            name: checkbox.value,
            uuid: checkbox.dataset.uuid
        }));

        if (selectedMembers.length === 0) {
            alert('Please select at least one speaker to add to the group.');
            return;
        }

        try {
            // Get the coordinator UUID from the dialog data
            const coordinatorName = document.getElementById('coordinator-name').textContent;
            const coordinatorDevice = this.devices.find(device => device.name === coordinatorName);

            if (!coordinatorDevice) {
                alert('Coordinator device not found.');
                return;
            }

            // Create group with coordinator and selected members
            const groupData = {
                coordinator: coordinatorDevice.name,
                members: selectedMembers.map(member => member.name)
            };

            console.log('Creating group with data:', groupData);

            const response = await fetch('/api/sonos/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });

            if (response.ok) {
                console.log('Speakers added to group successfully');
                this.closeAddSpeakerDialog();
                this.loadData(); // Refresh data
            } else {
                const error = await response.text();
                alert('Failed to add speakers to group: ' + error);
            }
        } catch (error) {
            console.error('Error adding speakers to group:', error);
            alert('Failed to add speakers to group: ' + error.message);
        }
    }

    closeAddSpeakerDialog() {
        const dialog = document.getElementById('add-speaker-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    async dissolveGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/dissolve`, {
                method: 'POST'
            });

            if (response.ok) {
                console.log('Group dissolved successfully');
                this.loadData(); // Refresh data
            } else {
                const error = await response.text();
                alert('Failed to dissolve group: ' + error);
            }
        } catch (error) {
            console.error('Error dissolving group:', error);
            alert('Failed to dissolve group: ' + error.message);
        }
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

        // Update unified view
        if (this.unifiedView) {
            this.unifiedView.updateView(this.devices, this.groups);
        }
    }

    updateGroup(group) {
        // Update group in the groups array
        const index = this.groups.findIndex(g => g.id === group.id);
        if (index !== -1) {
            this.groups[index] = group;
        }

        // Update unified view
        if (this.unifiedView) {
            this.unifiedView.updateView(this.devices, this.groups);
        }
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

// Make sonosSection globally accessible for dialog callbacks
window.sonosSection = sonosSection;