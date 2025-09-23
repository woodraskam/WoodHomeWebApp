/**
 * Woodraska Cribbage - Game State Management
 * Handles game state, player data, score tracking, and phase management
 */

class CribbageGameState {
    constructor() {
        this.gameId = null;
        this.player1Email = null;
        this.player2Email = null;
        this.currentPlayer = null;
        this.currentPhase = 'waiting'; // waiting, deal, discard, play, count, finished
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Hand = [];
        this.player2Hand = [];
        this.crib = [];
        this.playedCards = [];
        this.currentTotal = 0;
        this.lastPlayedBy = null;
        this.gameStatus = 'active'; // active, paused, finished
        this.winner = null;
        this.createdAt = null;
        this.updatedAt = null;

        // Phase-specific data
        this.discardPhase = {
            player1Discarded: false,
            player2Discarded: false,
            player1Cards: [],
            player2Cards: []
        };

        this.playPhase = {
            currentTotal: 0,
            consecutivePasses: 0,
            lastCardPlayed: null,
            playOrder: []
        };

        this.countPhase = {
            player1Counted: false,
            player2Counted: false,
            player1HandScore: 0,
            player2HandScore: 0,
            cribScore: 0
        };
    }

    /**
     * Initialize game state
     */
    initialize(gameData) {
        this.gameId = gameData.gameId;
        this.player1Email = gameData.player1Email;
        this.player2Email = gameData.player2Email;
        this.currentPlayer = gameData.currentPlayer || this.player1Email;
        this.currentPhase = gameData.currentPhase || 'waiting';
        this.player1Score = gameData.player1Score || 0;
        this.player2Score = gameData.player2Score || 0;
        this.gameStatus = gameData.gameStatus || 'active';
        this.createdAt = gameData.createdAt;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update game state from server response
     */
    updateFromServer(serverState) {
        if (serverState.gameId) this.gameId = serverState.gameId;
        if (serverState.player1Email) this.player1Email = serverState.player1Email;
        if (serverState.player2Email) this.player2Email = serverState.player2Email;
        if (serverState.currentPlayer) this.currentPlayer = serverState.currentPlayer;
        if (serverState.currentPhase) this.currentPhase = serverState.currentPhase;
        if (serverState.player1Score !== undefined) this.player1Score = serverState.player1Score;
        if (serverState.player2Score !== undefined) this.player2Score = serverState.player2Score;
        if (serverState.player1Hand) this.player1Hand = serverState.player1Hand;
        if (serverState.player2Hand) this.player2Hand = serverState.player2Hand;
        if (serverState.crib) this.crib = serverState.crib;
        if (serverState.playedCards) this.playedCards = serverState.playedCards;
        if (serverState.currentTotal !== undefined) this.currentTotal = serverState.currentTotal;
        if (serverState.lastPlayedBy) this.lastPlayedBy = serverState.lastPlayedBy;
        if (serverState.gameStatus) this.gameStatus = serverState.gameStatus;
        if (serverState.winner) this.winner = serverState.winner;

        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get current player's hand
     */
    getCurrentPlayerHand(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.player1Hand;
        } else if (playerEmail === this.player2Email) {
            return this.player2Hand;
        }
        return [];
    }

    /**
     * Get opponent's hand (for display purposes)
     */
    getOpponentHand(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.player2Hand;
        } else if (playerEmail === this.player2Email) {
            return this.player1Hand;
        }
        return [];
    }

    /**
     * Check if it's the current player's turn
     */
    isCurrentPlayer(playerEmail) {
        return this.currentPlayer === playerEmail;
    }

    /**
     * Get current player's score
     */
    getCurrentPlayerScore(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.player1Score;
        } else if (playerEmail === this.player2Email) {
            return this.player2Score;
        }
        return 0;
    }

    /**
     * Get opponent's score
     */
    getOpponentScore(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.player2Score;
        } else if (playerEmail === this.player2Email) {
            return this.player1Score;
        }
        return 0;
    }

    /**
     * Check if game is finished
     */
    isGameFinished() {
        return this.gameStatus === 'finished' || this.winner !== null;
    }

    /**
     * Check if game is waiting for players
     */
    isWaitingForPlayers() {
        return this.currentPhase === 'waiting';
    }

    /**
     * Check if game is in discard phase
     */
    isDiscardPhase() {
        return this.currentPhase === 'discard';
    }

    /**
     * Check if game is in play phase
     */
    isPlayPhase() {
        return this.currentPhase === 'play';
    }

    /**
     * Check if game is in count phase
     */
    isCountPhase() {
        return this.currentPhase === 'count';
    }

    /**
     * Get game phase display name
     */
    getPhaseDisplayName() {
        const phaseNames = {
            'waiting': 'Waiting for Players',
            'deal': 'Dealing Cards',
            'discard': 'Discard to Crib',
            'play': 'Play Cards',
            'count': 'Count Hands',
            'finished': 'Game Finished'
        };
        return phaseNames[this.currentPhase] || this.currentPhase;
    }

    /**
     * Get current player display name
     */
    getCurrentPlayerDisplayName() {
        if (this.currentPlayer === this.player1Email) {
            return 'Player 1';
        } else if (this.currentPlayer === this.player2Email) {
            return 'Player 2';
        }
        return 'Unknown';
    }

    /**
     * Get player display name
     */
    getPlayerDisplayName(playerEmail) {
        if (playerEmail === this.player1Email) {
            return 'Player 1';
        } else if (playerEmail === this.player2Email) {
            return 'Player 2';
        }
        return 'Unknown';
    }

    /**
     * Check if player has discarded in discard phase
     */
    hasPlayerDiscarded(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.discardPhase.player1Discarded;
        } else if (playerEmail === this.player2Email) {
            return this.discardPhase.player2Discarded;
        }
        return false;
    }

    /**
     * Check if both players have discarded
     */
    bothPlayersDiscarded() {
        return this.discardPhase.player1Discarded && this.discardPhase.player2Discarded;
    }

    /**
     * Check if player has counted in count phase
     */
    hasPlayerCounted(playerEmail) {
        if (playerEmail === this.player1Email) {
            return this.countPhase.player1Counted;
        } else if (playerEmail === this.player2Email) {
            return this.countPhase.player2Counted;
        }
        return false;
    }

    /**
     * Check if both players have counted
     */
    bothPlayersCounted() {
        return this.countPhase.player1Counted && this.countPhase.player2Counted;
    }

    /**
     * Get playable cards for current player
     */
    getPlayableCards(playerEmail) {
        if (!this.isPlayPhase() || !this.isCurrentPlayer(playerEmail)) {
            return [];
        }

        const hand = this.getCurrentPlayerHand(playerEmail);
        return hand.filter(card => this.isCardPlayable(card));
    }

    /**
     * Check if a card is playable
     */
    isCardPlayable(card) {
        if (!this.isPlayPhase()) {
            return false;
        }

        const cardValue = this.getCardValue(card);
        return (this.currentTotal + cardValue) <= 31;
    }

    /**
     * Get card value for play
     */
    getCardValue(card) {
        const valueMap = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 10, 'Q': 10, 'K': 10
        };
        return valueMap[card.value] || 0;
    }

    /**
     * Get card display value
     */
    getCardDisplayValue(card) {
        return card.value;
    }

    /**
     * Get card suit symbol
     */
    getCardSuitSymbol(card) {
        const symbols = {
            'HEARTS': '♥',
            'DIAMONDS': '♦',
            'CLUBS': '♣',
            'SPADES': '♠'
        };
        return symbols[card.suit] || card.suit;
    }

    /**
     * Get card color class
     */
    getCardColorClass(card) {
        return (card.suit === 'HEARTS' || card.suit === 'DIAMONDS') ? 'red' : 'black';
    }

    /**
     * Get game status message
     */
    getStatusMessage(playerEmail) {
        if (this.isGameFinished()) {
            if (this.winner === playerEmail) {
                return 'You won!';
            } else {
                return 'You lost!';
            }
        }

        if (this.isWaitingForPlayers()) {
            return 'Waiting for another player to join...';
        }

        if (!this.isCurrentPlayer(playerEmail)) {
            return `Waiting for ${this.getCurrentPlayerDisplayName()}...`;
        }

        switch (this.currentPhase) {
            case 'discard':
                return 'Select 2 cards to discard to the crib';
            case 'play':
                return 'Play a card or pass';
            case 'count':
                return 'Count your hand';
            default:
                return 'Game in progress...';
        }
    }

    /**
     * Get available actions for current player
     */
    getAvailableActions(playerEmail) {
        if (!this.isCurrentPlayer(playerEmail) || this.isGameFinished()) {
            return [];
        }

        const actions = [];

        switch (this.currentPhase) {
            case 'discard':
                actions.push('discard');
                break;
            case 'play':
                actions.push('play-card', 'go');
                break;
            case 'count':
                actions.push('count-hand');
                break;
        }

        return actions;
    }

    /**
     * Get game summary
     */
    getGameSummary() {
        return {
            gameId: this.gameId,
            player1Email: this.player1Email,
            player2Email: this.player2Email,
            currentPlayer: this.currentPlayer,
            currentPhase: this.currentPhase,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            gameStatus: this.gameStatus,
            winner: this.winner,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Export game state for server
     */
    exportForServer() {
        return {
            gameId: this.gameId,
            player1Email: this.player1Email,
            player2Email: this.player2Email,
            currentPlayer: this.currentPlayer,
            currentPhase: this.currentPhase,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            player1Hand: this.player1Hand,
            player2Hand: this.player2Hand,
            crib: this.crib,
            playedCards: this.playedCards,
            currentTotal: this.currentTotal,
            lastPlayedBy: this.lastPlayedBy,
            gameStatus: this.gameStatus,
            winner: this.winner,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Clone game state
     */
    clone() {
        const cloned = new CribbageGameState();
        Object.assign(cloned, this);
        return cloned;
    }

    /**
     * Reset game state
     */
    reset() {
        this.gameId = null;
        this.player1Email = null;
        this.player2Email = null;
        this.currentPlayer = null;
        this.currentPhase = 'waiting';
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Hand = [];
        this.player2Hand = [];
        this.crib = [];
        this.playedCards = [];
        this.currentTotal = 0;
        this.lastPlayedBy = null;
        this.gameStatus = 'active';
        this.winner = null;
        this.createdAt = null;
        this.updatedAt = null;

        this.discardPhase = {
            player1Discarded: false,
            player2Discarded: false,
            player1Cards: [],
            player2Cards: []
        };

        this.playPhase = {
            currentTotal: 0,
            consecutivePasses: 0,
            lastCardPlayed: null,
            playOrder: []
        };

        this.countPhase = {
            player1Counted: false,
            player2Counted: false,
            player1HandScore: 0,
            player2HandScore: 0,
            cribScore: 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CribbageGameState;
}
