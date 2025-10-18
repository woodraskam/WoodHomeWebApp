// Memory Game - Game State Management

class MemoryGameState {
    constructor() {
        this.gridSize = 4; // 4x4, 6x6, or 8x8
        this.cards = []; // 2D array of card objects
        this.players = []; // Array of player objects
        this.currentPlayer = 0;
        this.gamePhase = 'setup'; // 'setup', 'playing', 'finished'
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.flippedCards = []; // Currently revealed cards (max 2)
        this.moves = 0;
        this.timer = 0;
        this.gameStartTime = null;
        this.isGameActive = false;
    }

    initializeGame() {
        this.gamePhase = 'playing';
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.moves = 0;
        this.timer = 0;
        this.gameStartTime = Date.now();
        this.isGameActive = true;
        this.totalPairs = (this.gridSize * this.gridSize) / 2;
        
        // Initialize cards array
        this.cards = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            this.cards.push({
                id: i,
                emoji: '',
                isFlipped: false,
                isMatched: false,
                pairId: null
            });
        }
    }

    resetGame() {
        this.gamePhase = 'setup';
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.moves = 0;
        this.timer = 0;
        this.gameStartTime = null;
        this.isGameActive = false;
        
        // Reset all cards
        this.cards.forEach(card => {
            card.isFlipped = false;
            card.isMatched = false;
        });
    }

    updateGridSize(newSize) {
        this.gridSize = newSize;
        this.totalPairs = (newSize * newSize) / 2;
        this.resetGame();
    }

    addFlippedCard(cardIndex) {
        if (this.flippedCards.length < 2 && !this.cards[cardIndex].isFlipped) {
            this.flippedCards.push(cardIndex);
            this.cards[cardIndex].isFlipped = true;
            return true;
        }
        return false;
    }

    clearFlippedCards() {
        this.flippedCards.forEach(cardIndex => {
            this.cards[cardIndex].isFlipped = false;
        });
        this.flippedCards = [];
    }

    markCardsAsMatched() {
        this.flippedCards.forEach(cardIndex => {
            this.cards[cardIndex].isMatched = true;
        });
        this.matchedPairs++;
        this.flippedCards = [];
    }

    isGameComplete() {
        return this.matchedPairs === this.totalPairs;
    }

    getGameTime() {
        if (this.gameStartTime) {
            return Math.floor((Date.now() - this.gameStartTime) / 1000);
        }
        return 0;
    }

    getGameStats() {
        return {
            moves: this.moves,
            time: this.getGameTime(),
            matchedPairs: this.matchedPairs,
            totalPairs: this.totalPairs,
            completionRate: (this.matchedPairs / this.totalPairs) * 100
        };
    }
}

class Card {
    constructor(emoji, id, row, col) {
        this.emoji = emoji;
        this.id = id;
        this.row = row;
        this.col = col;
        this.isFlipped = false;
        this.isMatched = false;
        this.pairId = null; // Links paired cards
    }

    flip() {
        this.isFlipped = !this.isFlipped;
    }

    match() {
        this.isMatched = true;
        this.isFlipped = true;
    }

    reset() {
        this.isFlipped = false;
        this.isMatched = false;
    }
}

class Player {
    constructor(name, color, isAI = false) {
        this.name = name;
        this.color = color;
        this.score = 0;
        this.matches = 0;
        this.isAI = isAI;
        this.isActive = true;
        this.moves = 0;
        this.accuracy = 0;
    }

    addMatch() {
        this.matches++;
        this.score += 10; // Base points per match
        this.updateAccuracy();
    }

    addMove() {
        this.moves++;
        this.updateAccuracy();
    }

    updateAccuracy() {
        if (this.moves > 0) {
            this.accuracy = (this.matches / this.moves) * 100;
        }
    }

    reset() {
        this.score = 0;
        this.matches = 0;
        this.moves = 0;
        this.accuracy = 0;
    }

    getStats() {
        return {
            name: this.name,
            color: this.color,
            score: this.score,
            matches: this.matches,
            moves: this.moves,
            accuracy: this.accuracy,
            isAI: this.isAI
        };
    }
}
