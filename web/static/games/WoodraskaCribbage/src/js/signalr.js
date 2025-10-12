/**
 * Woodraska Cribbage - Real-time Communication
 * Handles SSE connection management, real-time update handling, connection error handling, and reconnection logic
 */

class CribbageSignalR {
    constructor() {
        this.eventSource = null;
        this.gameId = null;
        this.playerEmail = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.heartbeatInterval = null;
        this.lastHeartbeat = null;
        this.heartbeatTimeout = 30000; // 30 seconds

        // Event handlers
        this.onGameUpdate = null;
        this.onConnectionLost = null;
        this.onConnectionRestored = null;
        this.onError = null;
    }

    /**
     * Connect to game updates via Server-Sent Events
     */
    connect(gameId, playerEmail) {
        this.gameId = gameId;
        this.playerEmail = playerEmail;

        if (this.eventSource) {
            this.disconnect();
        }

        const url = `/api/cribbage/updates?gameId=${gameId}&playerEmail=${playerEmail}`;
        this.eventSource = new EventSource(url);

        this.setupEventHandlers();
        this.startHeartbeat();

        console.log(`Connected to game updates: ${gameId}`);
    }

    /**
     * Setup event handlers for SSE
     */
    setupEventHandlers() {
        if (!this.eventSource) return;

        // Handle incoming messages
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse SSE message:', error);
                this.handleError('Failed to parse server message');
            }
        };

        // Handle connection open
        this.eventSource.onopen = () => {
            console.log('SSE connection opened');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;

            if (this.onConnectionRestored) {
                this.onConnectionRestored();
            }
        };

        // Handle connection errors
        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            this.isConnected = false;

            if (this.onConnectionLost) {
                this.onConnectionLost();
            }

            this.attemptReconnect();
        };
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data) {
        this.lastHeartbeat = Date.now();

        switch (data.type) {
            case 'heartbeat':
                // Heartbeat received, connection is alive
                break;

            case 'game_update':
                if (this.onGameUpdate) {
                    this.onGameUpdate(data.payload);
                }
                break;

            case 'player_joined':
                this.handlePlayerJoined(data.payload);
                break;

            case 'player_left':
                this.handlePlayerLeft(data.payload);
                break;

            case 'card_played':
                this.handleCardPlayed(data.payload);
                break;

            case 'score_update':
                this.handleScoreUpdate(data.payload);
                break;

            case 'phase_change':
                this.handlePhaseChange(data.payload);
                break;

            case 'game_end':
                this.handleGameEnd(data.payload);
                break;

            case 'error':
                this.handleServerError(data.payload);
                break;

            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    /**
     * Handle player joined event
     */
    handlePlayerJoined(data) {
        console.log('Player joined:', data.playerEmail);
        // Update UI to show player has joined
        this.showNotification(`${data.playerEmail} has joined the game`, 'info');
    }

    /**
     * Handle player left event
     */
    handlePlayerLeft(data) {
        console.log('Player left:', data.playerEmail);
        this.showNotification(`${data.playerEmail} has left the game`, 'warning');
    }

    /**
     * Handle card played event
     */
    handleCardPlayed(data) {
        console.log('Card played:', data);
        // Update UI to show card was played
        this.updateCardDisplay(data);
    }

    /**
     * Handle score update event
     */
    handleScoreUpdate(data) {
        console.log('Score updated:', data);
        // Update score display
        this.updateScoreDisplay(data);
    }

    /**
     * Handle phase change event
     */
    handlePhaseChange(data) {
        console.log('Phase changed:', data);
        // Update phase display and available actions
        this.updatePhaseDisplay(data);
    }

    /**
     * Handle game end event
     */
    handleGameEnd(data) {
        console.log('Game ended:', data);
        this.showNotification(`Game Over! ${data.winner} wins!`, 'success');
        // Disable game controls
        this.disableGameControls();
    }

    /**
     * Handle server error
     */
    handleServerError(data) {
        console.error('Server error:', data);
        this.showNotification(`Server error: ${data.message}`, 'error');
    }

    /**
     * Handle general error
     */
    handleError(message) {
        console.error('SignalR error:', message);
        if (this.onError) {
            this.onError(message);
        }
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.showNotification('Connection lost. Please refresh the page.', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, this.maxReconnectDelay);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (this.gameId && this.playerEmail) {
                this.connect(this.gameId, this.playerEmail);
            }
        }, delay);
    }

    /**
     * Start heartbeat monitoring
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.checkHeartbeat();
        }, 5000); // Check every 5 seconds
    }

    /**
     * Check heartbeat
     */
    checkHeartbeat() {
        if (!this.lastHeartbeat) {
            this.lastHeartbeat = Date.now();
            return;
        }

        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;

        if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
            console.warn('Heartbeat timeout, attempting reconnection');
            this.isConnected = false;
            this.attemptReconnect();
        }
    }

    /**
     * Stop heartbeat monitoring
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Disconnect from SSE
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.stopHeartbeat();
        this.isConnected = false;
        console.log('Disconnected from game updates');
    }

    /**
     * Send message to server (if needed)
     */
    sendMessage(type, data) {
        if (!this.isConnected) {
            console.warn('Cannot send message: not connected');
            return;
        }

        // For SSE, we typically send messages via regular HTTP requests
        // This method is here for consistency with SignalR patterns
        console.log('Sending message:', type, data);
    }

    /**
     * Update card display
     */
    updateCardDisplay(data) {
        // Update UI to show the played card
        const playedCardsContainer = document.querySelector('.played-cards');
        if (playedCardsContainer) {
            const cardElement = this.createCardElement(data.card);
            playedCardsContainer.appendChild(cardElement);
        }
    }

    /**
     * Update score display
     */
    updateScoreDisplay(data) {
        const player1Score = document.querySelector('.player1-score');
        const player2Score = document.querySelector('.player2-score');

        if (player1Score && data.player1Score !== undefined) {
            player1Score.textContent = data.player1Score;
        }

        if (player2Score && data.player2Score !== undefined) {
            player2Score.textContent = data.player2Score;
        }
    }

    /**
     * Update phase display
     */
    updatePhaseDisplay(data) {
        const phaseElement = document.querySelector('.game-phase');
        if (phaseElement) {
            phaseElement.textContent = data.phase;
        }
    }

    /**
     * Create card element
     */
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.suit.toLowerCase()}`;
        cardDiv.dataset.cardId = card.id;

        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${this.getSuitSymbol(card.suit)}</div>
        `;

        return cardDiv;
    }

    /**
     * Get suit symbol
     */
    getSuitSymbol(suit) {
        const symbols = {
            'HEARTS': '♥',
            'DIAMONDS': '♦',
            'CLUBS': '♣',
            'SPADES': '♠'
        };
        return symbols[suit] || suit;
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Disable game controls
     */
    disableGameControls() {
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.disabled = true;
        });
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            lastHeartbeat: this.lastHeartbeat
        };
    }

    /**
     * Set event handlers
     */
    setOnGameUpdate(handler) {
        this.onGameUpdate = handler;
    }

    setOnConnectionLost(handler) {
        this.onConnectionLost = handler;
    }

    setOnConnectionRestored(handler) {
        this.onConnectionRestored = handler;
    }

    setOnError(handler) {
        this.onError = handler;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CribbageSignalR;
}
