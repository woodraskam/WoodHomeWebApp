// Sonos WebSocket Handler
class SonosWebSocket {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 5000; // 5 seconds
        this.heartbeatInterval = null;
        this.isConnected = false;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sonos`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.dashboard.updateConnectionStatus(true);
            this.startHeartbeat();
        };
        
        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.websocket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.dashboard.updateConnectionStatus(false);
            this.stopHeartbeat();
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            } else {
                console.error('Max reconnection attempts reached');
            }
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
            this.dashboard.updateConnectionStatus(false);
        };
    }

    handleMessage(data) {
        console.log('WebSocket message received:', data);
        
        switch (data.type) {
            case 'device_update':
                this.dashboard.updateDevice(data.device);
                break;
            case 'group_update':
                this.dashboard.updateGroup(data.group);
                break;
            case 'device_list':
                this.dashboard.devices = data.devices;
                this.dashboard.renderDevices();
                this.dashboard.updateDeviceCount();
                break;
            case 'group_list':
                this.dashboard.groups = data.groups;
                this.dashboard.renderGroups();
                break;
            case 'heartbeat':
                // Respond to heartbeat
                this.send({ type: 'pong' });
                break;
            case 'error':
                console.error('WebSocket error from server:', data.message);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    send(data) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
        
        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping' });
            }
        }, 30000); // Send ping every 30 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
    }

    // Request methods
    requestDevices() {
        this.send({ type: 'get_devices' });
    }

    requestGroups() {
        this.send({ type: 'get_groups' });
    }

    requestDeviceUpdate(deviceUuid) {
        this.send({ type: 'get_device', deviceUuid });
    }

    requestGroupUpdate(groupId) {
        this.send({ type: 'get_group', groupId });
    }
}

// Export for use in other modules
window.SonosWebSocket = SonosWebSocket;
