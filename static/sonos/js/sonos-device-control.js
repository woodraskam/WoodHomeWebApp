// Sonos Device Control JavaScript
class SonosDeviceControl {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.currentDevice = null;
        this.modal = null;
    }

    init() {
        this.modal = document.getElementById('device-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal control buttons
        document.getElementById('modal-play')?.addEventListener('click', () => {
            if (this.currentDevice) {
                this.dashboard.playDevice(this.currentDevice.uuid);
            }
        });

        document.getElementById('modal-pause')?.addEventListener('click', () => {
            if (this.currentDevice) {
                this.dashboard.pauseDevice(this.currentDevice.uuid);
            }
        });

        document.getElementById('modal-stop')?.addEventListener('click', () => {
            if (this.currentDevice) {
                this.dashboard.stopDevice(this.currentDevice.uuid);
            }
        });

        document.getElementById('modal-next')?.addEventListener('click', () => {
            if (this.currentDevice) {
                this.dashboard.nextTrack(this.currentDevice.uuid);
            }
        });

        document.getElementById('modal-previous')?.addEventListener('click', () => {
            if (this.currentDevice) {
                this.dashboard.previousTrack(this.currentDevice.uuid);
            }
        });

        // Volume control
        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        
        if (volumeSlider && volumeDisplay) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value);
                volumeDisplay.textContent = `${volume}%`;
                
                if (this.currentDevice) {
                    this.dashboard.setVolume(this.currentDevice.uuid, volume);
                }
            });
        }

        // Mute button
        document.getElementById('mute-btn')?.addEventListener('click', () => {
            if (this.currentDevice) {
                const isMuted = this.currentDevice.mute;
                this.dashboard.setMute(this.currentDevice.uuid, !isMuted);
            }
        });
    }

    openDeviceModal(device) {
        this.currentDevice = device;
        
        if (this.modal) {
            // Update modal content
            document.getElementById('modal-device-name').textContent = device.name;
            
            // Update volume controls
            const volumeSlider = document.getElementById('volume-slider');
            const volumeDisplay = document.getElementById('volume-display');
            
            if (volumeSlider && volumeDisplay) {
                volumeSlider.value = device.volume || 0;
                volumeDisplay.textContent = `${device.volume || 0}%`;
            }

            // Update mute button
            const muteBtn = document.getElementById('mute-btn');
            if (muteBtn) {
                muteBtn.textContent = device.mute ? '🔊' : '🔇';
                muteBtn.title = device.mute ? 'Unmute' : 'Mute';
            }

            // Update playback buttons based on device state
            this.updatePlaybackButtons(device);

            // Show modal
            this.modal.style.display = 'block';
        }
    }

    updatePlaybackButtons(device) {
        const playBtn = document.getElementById('modal-play');
        const pauseBtn = document.getElementById('modal-pause');
        const stopBtn = document.getElementById('modal-stop');

        if (!playBtn || !pauseBtn || !stopBtn) return;

        // Reset all buttons
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;

        // Update based on device state
        switch (device.state) {
            case 'PLAYING':
                playBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                break;
            case 'PAUSED_PLAYBACK':
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = false;
                break;
            case 'STOPPED':
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                break;
            default:
                playBtn.disabled = false;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
        }
    }

    updateDevice(device) {
        if (this.currentDevice && this.currentDevice.uuid === device.uuid) {
            this.currentDevice = device;
            this.updatePlaybackButtons(device);
            
            // Update volume display
            const volumeSlider = document.getElementById('volume-slider');
            const volumeDisplay = document.getElementById('volume-display');
            
            if (volumeSlider && volumeDisplay) {
                volumeSlider.value = device.volume || 0;
                volumeDisplay.textContent = `${device.volume || 0}%`;
            }

            // Update mute button
            const muteBtn = document.getElementById('mute-btn');
            if (muteBtn) {
                muteBtn.textContent = device.mute ? '🔊' : '🔇';
                muteBtn.title = device.mute ? 'Unmute' : 'Mute';
            }
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentDevice = null;
        }
    }

    // Device control methods
    async playDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/play`, { 
                method: 'POST' 
            });
            if (!response.ok) {
                throw new Error('Failed to play device');
            }
            console.log(`Playing device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error playing device:', error);
            this.showError('Failed to play device');
        }
    }

    async pauseDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/pause`, { 
                method: 'POST' 
            });
            if (!response.ok) {
                throw new Error('Failed to pause device');
            }
            console.log(`Pausing device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error pausing device:', error);
            this.showError('Failed to pause device');
        }
    }

    async stopDevice(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/stop`, { 
                method: 'POST' 
            });
            if (!response.ok) {
                throw new Error('Failed to stop device');
            }
            console.log(`Stopping device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error stopping device:', error);
            this.showError('Failed to stop device');
        }
    }

    async nextTrack(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/next`, { 
                method: 'POST' 
            });
            if (!response.ok) {
                throw new Error('Failed to skip to next track');
            }
            console.log(`Next track on device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error skipping to next track:', error);
            this.showError('Failed to skip to next track');
        }
    }

    async previousTrack(deviceUuid) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/previous`, { 
                method: 'POST' 
            });
            if (!response.ok) {
                throw new Error('Failed to skip to previous track');
            }
            console.log(`Previous track on device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error skipping to previous track:', error);
            this.showError('Failed to skip to previous track');
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
            console.log(`Volume set to ${volume} on device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error setting volume:', error);
            this.showError('Failed to set volume');
        }
    }

    async setMute(deviceUuid, mute) {
        try {
            const response = await fetch(`/api/sonos/devices/${deviceUuid}/mute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mute: mute })
            });
            if (!response.ok) {
                throw new Error('Failed to set mute');
            }
            console.log(`Mute set to ${mute} on device: ${deviceUuid}`);
        } catch (error) {
            console.error('Error setting mute:', error);
            this.showError('Failed to set mute');
        }
    }

    showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Export for use in other modules
window.SonosDeviceControl = SonosDeviceControl;
