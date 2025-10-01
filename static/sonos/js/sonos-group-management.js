// Sonos Group Management JavaScript
class SonosGroupManagement {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.groupModal = null;
        this.currentGroup = null;
    }

    init() {
        this.groupModal = document.getElementById('group-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Group creation button
        document.getElementById('create-group-btn')?.addEventListener('click', () => {
            this.createGroup();
        });

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

    openGroupModal() {
        if (this.groupModal) {
            this.populateGroupModal();
            this.groupModal.style.display = 'block';
        }
    }

    populateGroupModal() {
        // Populate coordinator dropdown
        const coordinatorSelect = document.getElementById('coordinator-select');
        const memberCheckboxes = document.getElementById('member-checkboxes');
        
        if (!coordinatorSelect || !memberCheckboxes) return;

        // Clear existing options
        coordinatorSelect.innerHTML = '<option value="">Select coordinator...</option>';
        memberCheckboxes.innerHTML = '';

        // Add devices to coordinator dropdown and member checkboxes
        this.dashboard.devices.forEach(device => {
            if (!device.is_online) return;

            // Add to coordinator dropdown
            const coordinatorOption = document.createElement('option');
            coordinatorOption.value = device.uuid;
            coordinatorOption.textContent = device.name;
            coordinatorSelect.appendChild(coordinatorOption);

            // Add to member checkboxes
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'member-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `member-${device.uuid}`;
            checkbox.value = device.uuid;
            
            const label = document.createElement('label');
            label.htmlFor = `member-${device.uuid}`;
            label.textContent = device.name;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            memberCheckboxes.appendChild(checkboxContainer);
        });
    }

    async createGroup() {
        const coordinatorSelect = document.getElementById('coordinator-select');
        const memberCheckboxes = document.querySelectorAll('#member-checkboxes input[type="checkbox"]:checked');
        
        if (!coordinatorSelect || coordinatorSelect.value === '') {
            this.showError('Please select a coordinator room');
            return;
        }

        if (memberCheckboxes.length === 0) {
            this.showError('Please select at least one member room');
            return;
        }

        const coordinatorUuid = coordinatorSelect.value;
        const memberUuids = Array.from(memberCheckboxes).map(cb => cb.value);

        // Ensure coordinator is not also selected as a member
        const filteredMembers = memberUuids.filter(uuid => uuid !== coordinatorUuid);

        try {
            const response = await fetch('/api/sonos/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coordinator: coordinatorUuid,
                    members: filteredMembers
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create group');
            }

            console.log('Group created successfully');
            this.showSuccess('Group created successfully');
            this.closeGroupModal();
            
            // Refresh groups
            this.dashboard.loadGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            this.showError('Failed to create group');
        }
    }

    async joinGroup(groupId, deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/join/${deviceUuid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to join group: ${errorText}`);
            }

            console.log(`Device ${deviceUuid} joined group ${groupId}`);
            this.showSuccess('Device joined group successfully');
            
            // Refresh groups
            this.dashboard.loadGroups();
        } catch (error) {
            console.error('Error joining group:', error);
            this.showError('Failed to join group: ' + error.message);
        }
    }

    async leaveGroup(groupId, deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/leave/${deviceUuid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to leave group');
            }

            console.log(`Device ${deviceUuid} left group ${groupId}`);
            this.showSuccess('Device left group successfully');
            
            // Refresh groups
            this.dashboard.loadGroups();
        } catch (error) {
            console.error('Error leaving group:', error);
            this.showError('Failed to leave group');
        }
    }

    async dissolveGroup(groupId) {
        if (!confirm('Are you sure you want to dissolve this group?')) {
            return;
        }

        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/dissolve`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to dissolve group');
            }

            console.log(`Group ${groupId} dissolved`);
            this.showSuccess('Group dissolved successfully');
            
            // Refresh groups
            this.dashboard.loadGroups();
        } catch (error) {
            console.error('Error dissolving group:', error);
            this.showError('Failed to dissolve group');
        }
    }

    async playGroup(groupId) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/play`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to play group');
            }

            console.log(`Playing group ${groupId}`);
        } catch (error) {
            console.error('Error playing group:', error);
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

            console.log(`Pausing group ${groupId}`);
        } catch (error) {
            console.error('Error pausing group:', error);
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

            console.log(`Stopping group ${groupId}`);
        } catch (error) {
            console.error('Error stopping group:', error);
            this.showError('Failed to stop group');
        }
    }

    async setGroupVolume(groupId, volume) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/volume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ volume: parseInt(volume) })
            });

            if (!response.ok) {
                throw new Error('Failed to set group volume');
            }

            console.log(`Group ${groupId} volume set to ${volume}`);
        } catch (error) {
            console.error('Error setting group volume:', error);
            this.showError('Failed to set group volume');
        }
    }

    async setGroupMute(groupId, mute) {
        try {
            const response = await fetch(`/api/sonos/groups/${groupId}/mute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mute: mute })
            });

            if (!response.ok) {
                throw new Error('Failed to set group mute');
            }

            console.log(`Group ${groupId} mute set to ${mute}`);
        } catch (error) {
            console.error('Error setting group mute:', error);
            this.showError('Failed to set group mute');
        }
    }

    closeGroupModal() {
        if (this.groupModal) {
            this.groupModal.style.display = 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const bgColor = type === 'error' ? '#f44336' : '#4CAF50';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Export for use in other modules
window.SonosGroupManagement = SonosGroupManagement;
