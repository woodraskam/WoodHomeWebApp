/**
 * Woodraska Cribbage - Main Application Entry Point
 * Handles application initialization, event listeners, and HTMX integration
 */

class CribbageApp {
    constructor() {
        this.gameState = null;
        this.eventSource = null;
        this.isInitialized = false;
        this.currentGameId = null;
        this.playerEmail = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            this.setupEventListeners();
            this.initializeHTMX();
            this.loadGameState();
            this.isInitialized = true;
            console.log('CribbageApp initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CribbageApp:', error);
            this.showError('Failed to initialize the game. Please refresh the page.');
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Card selection events
        document.addEventListener('click', (event) => {
            if (event.target.closest('.card')) {
                this.handleCardClick(event);
            }
        });

        // Action button events
        document.addEventListener('click', (event) => {
            if (event.target.closest('.action-btn')) {
                this.handleActionClick(event);
            }
        });

        // Form submission events
        document.addEventListener('submit', (event) => {
            if (event.target.closest('.cribbage-form')) {
                this.handleFormSubmit(event);
            }
        });

        // HTMX events
        document.addEventListener('htmx:beforeRequest', (event) => {
            this.showLoading(event.detail.elt);
        });

        document.addEventListener('htmx:afterRequest', (event) => {
            this.hideLoading(event.detail.elt);
            this.handleHTMXResponse(event);
        });

        document.addEventListener('htmx:responseError', (event) => {
            this.handleHTMXError(event);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Visibility change events
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Initialize HTMX integration
     */
    initializeHTMX() {
        // Configure HTMX settings
        htmx.config.defaultSwapStyle = 'innerHTML';
        htmx.config.defaultSwapDelay = 100;
        htmx.config.defaultSettleDelay = 100;
        
        // Add SSE support
        htmx.config.useTemplateFragments = true;
    }

    /**
     * Load game state from URL parameters or localStorage
     */
    loadGameState() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentGameId = urlParams.get('gameId');
        this.playerEmail = urlParams.get('playerEmail');
        
        if (!this.currentGameId) {
            this.currentGameId = localStorage.getItem('cribbage_gameId');
        }
        
        if (!this.playerEmail) {
            this.playerEmail = localStorage.getItem('cribbage_playerEmail');
        }

        if (this.currentGameId && this.playerEmail) {
            this.connectToGame();
        }
    }

    /**
     * Connect to an existing game
     */
    async connectToGame() {
        try {
            this.showLoading();
            const response = await fetch(`/api/cribbage/state?gameId=${this.currentGameId}&playerEmail=${this.playerEmail}`);
            
            if (response.ok) {
                this.gameState = await response.json();
                this.updateUI();
                this.startSSEConnection();
            } else {
                throw new Error('Failed to connect to game');
            }
        } catch (error) {
            console.error('Failed to connect to game:', error);
            this.showError('Failed to connect to the game. Please check your connection.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle card click events
     */
    handleCardClick(event) {
        const card = event.target.closest('.card');
        if (!card || card.classList.contains('unplayable')) {
            return;
        }

        const cardId = card.dataset.cardId;
        const isSelected = card.classList.contains('selected');

        if (isSelected) {
            this.deselectCard(card);
        } else {
            this.selectCard(card);
        }

        this.updateActionButtons();
    }

    /**
     * Select a card
     */
    selectCard(card) {
        card.classList.add('selected');
        card.classList.add('card-select');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            card.classList.remove('card-select');
        }, 300);
    }

    /**
     * Deselect a card
     */
    deselectCard(card) {
        card.classList.remove('selected');
    }

    /**
     * Handle action button clicks
     */
    handleActionClick(event) {
        const button = event.target.closest('.action-btn');
        const action = button.dataset.action;
        
        switch (action) {
            case 'play-card':
                this.playSelectedCard();
                break;
            case 'discard':
                this.discardSelectedCards();
                break;
            case 'count-hand':
                this.countHand();
                break;
            case 'go':
                this.go();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    /**
     * Play the selected card
     */
    async playSelectedCard() {
        const selectedCard = document.querySelector('.card.selected');
        if (!selectedCard) {
            this.showError('Please select a card to play');
            return;
        }

        try {
            this.showLoading();
            const cardId = selectedCard.dataset.cardId;
            const response = await fetch('/api/cribbage/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.currentGameId,
                    playerEmail: this.playerEmail,
                    cardId: cardId,
                    action: 'play'
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.handleGameUpdate(result);
            } else {
                throw new Error('Failed to play card');
            }
        } catch (error) {
            console.error('Failed to play card:', error);
            this.showError('Failed to play card. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Discard selected cards to crib
     */
    async discardSelectedCards() {
        const selectedCards = document.querySelectorAll('.card.selected');
        if (selectedCards.length === 0) {
            this.showError('Please select cards to discard');
            return;
        }

        try {
            this.showLoading();
            const cardIds = Array.from(selectedCards).map(card => card.dataset.cardId);
            const response = await fetch('/api/cribbage/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.currentGameId,
                    playerEmail: this.playerEmail,
                    cardIds: cardIds,
                    action: 'discard'
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.handleGameUpdate(result);
            } else {
                throw new Error('Failed to discard cards');
            }
        } catch (error) {
            console.error('Failed to discard cards:', error);
            this.showError('Failed to discard cards. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Count hand for scoring
     */
    async countHand() {
        try {
            this.showLoading();
            const response = await fetch('/api/cribbage/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.currentGameId,
                    playerEmail: this.playerEmail,
                    action: 'count'
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.handleGameUpdate(result);
            } else {
                throw new Error('Failed to count hand');
            }
        } catch (error) {
            console.error('Failed to count hand:', error);
            this.showError('Failed to count hand. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Go action (pass turn)
     */
    async go() {
        try {
            this.showLoading();
            const response = await fetch('/api/cribbage/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: this.currentGameId,
                    playerEmail: this.playerEmail,
                    action: 'go'
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.handleGameUpdate(result);
            } else {
                throw new Error('Failed to go');
            }
        } catch (error) {
            console.error('Failed to go:', error);
            this.showError('Failed to go. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle form submissions
     */
    handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Handle different form types
        if (form.classList.contains('create-game-form')) {
            this.createGame(formData);
        } else if (form.classList.contains('join-game-form')) {
            this.joinGame(formData);
        }
    }

    /**
     * Create a new game
     */
    async createGame(formData) {
        try {
            this.showLoading();
            const response = await fetch('/api/cribbage/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerEmail: formData.get('playerEmail')
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.currentGameId = result.gameId;
                this.playerEmail = result.playerEmail;
                localStorage.setItem('cribbage_gameId', this.currentGameId);
                localStorage.setItem('cribbage_playerEmail', this.playerEmail);
                
                // Redirect to game board
                window.location.href = `/play/WoodraskaCribbage/board/?gameId=${this.currentGameId}&playerEmail=${this.playerEmail}`;
            } else {
                throw new Error('Failed to create game');
            }
        } catch (error) {
            console.error('Failed to create game:', error);
            this.showError('Failed to create game. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Join an existing game
     */
    async joinGame(formData) {
        try {
            this.showLoading();
            const response = await fetch('/api/cribbage/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: formData.get('gameId'),
                    playerEmail: formData.get('playerEmail')
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.currentGameId = result.gameId;
                this.playerEmail = result.playerEmail;
                localStorage.setItem('cribbage_gameId', this.currentGameId);
                localStorage.setItem('cribbage_playerEmail', this.playerEmail);
                
                // Redirect to game board
                window.location.href = `/play/WoodraskaCribbage/board/?gameId=${this.currentGameId}&playerEmail=${this.playerEmail}`;
            } else {
                throw new Error('Failed to join game');
            }
        } catch (error) {
            console.error('Failed to join game:', error);
            this.showError('Failed to join game. Please check the game ID and try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Start Server-Sent Events connection
     */
    startSSEConnection() {
        if (!this.currentGameId) return;

        this.eventSource = new EventSource(`/api/cribbage/updates?gameId=${this.currentGameId}&playerEmail=${this.playerEmail}`);
        
        this.eventSource.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);
                this.handleGameUpdate(update);
            } catch (error) {
                console.error('Failed to parse SSE message:', error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            this.showError('Connection lost. Attempting to reconnect...');
            setTimeout(() => this.startSSEConnection(), 5000);
        };
    }

    /**
     * Handle game updates from SSE
     */
    handleGameUpdate(update) {
        console.log('Game update received:', update);
        
        // Update game state
        if (update.gameState) {
            this.gameState = update.gameState;
        }

        // Update UI based on update type
        switch (update.type) {
            case 'card_played':
                this.updateCardPlayed(update.data);
                break;
            case 'score_update':
                this.updateScore(update.data);
                break;
            case 'phase_change':
                this.updatePhase(update.data);
                break;
            case 'game_end':
                this.handleGameEnd(update.data);
                break;
            default:
                this.updateUI();
        }
    }

    /**
     * Update UI based on current game state
     */
    updateUI() {
        if (!this.gameState) return;

        this.updatePlayerHand();
        this.updatePlayedCards();
        this.updateScore();
        this.updatePhase();
        this.updateActionButtons();
    }

    /**
     * Update player hand display
     */
    updatePlayerHand() {
        const handContainer = document.querySelector('.hand-cards');
        if (!handContainer || !this.gameState.playerHand) return;

        handContainer.innerHTML = '';
        
        this.gameState.playerHand.forEach(card => {
            const cardElement = this.createCardElement(card);
            handContainer.appendChild(cardElement);
        });
    }

    /**
     * Create a card element
     */
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.suit.toLowerCase()}`;
        cardDiv.dataset.cardId = card.id;
        
        if (card.playable === false) {
            cardDiv.classList.add('unplayable');
        }

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
     * Update played cards display
     */
    updatePlayedCards() {
        const playedContainer = document.querySelector('.played-cards');
        if (!playedContainer || !this.gameState.playedCards) return;

        playedContainer.innerHTML = '';
        
        this.gameState.playedCards.forEach(card => {
            const cardElement = this.createCardElement(card);
            cardElement.classList.add('card-in-play');
            playedContainer.appendChild(cardElement);
        });
    }

    /**
     * Update score display
     */
    updateScore() {
        if (!this.gameState) return;

        const player1Score = document.querySelector('.player1-score');
        const player2Score = document.querySelector('.player2Score');
        
        if (player1Score) {
            player1Score.textContent = this.gameState.player1Score || 0;
        }
        
        if (player2Score) {
            player2Score.textContent = this.gameState.player2Score || 0;
        }
    }

    /**
     * Update game phase
     */
    updatePhase() {
        if (!this.gameState) return;

        const phaseElement = document.querySelector('.game-phase');
        if (phaseElement) {
            phaseElement.textContent = this.gameState.currentPhase || 'Unknown';
        }
    }

    /**
     * Update action buttons based on game state
     */
    updateActionButtons() {
        const actionButtons = document.querySelectorAll('.action-btn');
        const selectedCards = document.querySelectorAll('.card.selected');
        
        actionButtons.forEach(button => {
            const action = button.dataset.action;
            let enabled = true;

            switch (action) {
                case 'play-card':
                    enabled = selectedCards.length === 1 && this.gameState?.currentPhase === 'play';
                    break;
                case 'discard':
                    enabled = selectedCards.length === 2 && this.gameState?.currentPhase === 'discard';
                    break;
                case 'count-hand':
                    enabled = this.gameState?.currentPhase === 'count';
                    break;
                case 'go':
                    enabled = this.gameState?.currentPhase === 'play';
                    break;
            }

            button.disabled = !enabled;
        });
    }

    /**
     * Handle game end
     */
    handleGameEnd(data) {
        this.showSuccess(`Game Over! ${data.winner} wins with ${data.finalScore} points!`);
        
        // Disable all action buttons
        document.querySelectorAll('.action-btn').forEach(button => {
            button.disabled = true;
        });
    }

    /**
     * Show loading state
     */
    showLoading(element = null) {
        if (element) {
            element.classList.add('loading');
        } else {
            document.body.classList.add('loading');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading(element = null) {
        if (element) {
            element.classList.remove('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
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
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause updates
            if (this.eventSource) {
                this.eventSource.close();
            }
        } else {
            // Page is visible, resume updates
            if (this.currentGameId) {
                this.startSSEConnection();
            }
        }
    }

    /**
     * Handle HTMX response
     */
    handleHTMXResponse(event) {
        // Custom HTMX response handling can be added here
        console.log('HTMX response received:', event.detail);
    }

    /**
     * Handle HTMX error
     */
    handleHTMXError(event) {
        console.error('HTMX error:', event.detail);
        this.showError('An error occurred. Please try again.');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.eventSource) {
            this.eventSource.close();
        }
    }
}

// Initialize the application
const cribbageApp = new CribbageApp();
