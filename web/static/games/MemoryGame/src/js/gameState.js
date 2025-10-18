// Memory Game - Game State Management

class MemoryGameState {
    constructor() {
        this.gridSize = 4; // 4x4, 6x6, or 8x8
        this.cards = []; // Array of card objects
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
        this.emojiSet = 'animals'; // Current emoji theme
        this.difficulty = 'easy'; // easy, medium, hard
        this.maxFlippedCards = 2; // Maximum cards that can be flipped at once
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
            // Only unflip cards that are not matched
            if (!this.cards[cardIndex].isMatched) {
                this.cards[cardIndex].isFlipped = false;
            }
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
            completionRate: (this.matchedPairs / this.totalPairs) * 100,
            gridSize: this.gridSize,
            emojiSet: this.emojiSet,
            difficulty: this.difficulty
        };
    }

    // Validation methods
    validateGridSize(size) {
        return [4, 6, 8].includes(size);
    }

    validatePlayerCount(count) {
        return count >= 1 && count <= 4;
    }

    validateEmojiSet(setName) {
        const validSets = ['animals', 'food', 'objects', 'seasonal'];
        return validSets.includes(setName);
    }

    validateDifficulty(level) {
        const validLevels = ['easy', 'medium', 'hard'];
        return validLevels.includes(level);
    }

    // State validation
    isGameStateValid() {
        return this.validateGridSize(this.gridSize) &&
               this.validatePlayerCount(this.players.length) &&
               this.validateEmojiSet(this.emojiSet) &&
               this.validateDifficulty(this.difficulty);
    }

    // Error handling
    getValidationErrors() {
        const errors = [];
        
        if (!this.validateGridSize(this.gridSize)) {
            errors.push(`Invalid grid size: ${this.gridSize}. Must be 4, 6, or 8.`);
        }
        
        if (!this.validatePlayerCount(this.players.length)) {
            errors.push(`Invalid player count: ${this.players.length}. Must be 1-4 players.`);
        }
        
        if (!this.validateEmojiSet(this.emojiSet)) {
            errors.push(`Invalid emoji set: ${this.emojiSet}. Must be animals, food, objects, or seasonal.`);
        }
        
        if (!this.validateDifficulty(this.difficulty)) {
            errors.push(`Invalid difficulty: ${this.difficulty}. Must be easy, medium, or hard.`);
        }
        
        return errors;
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
        this.flipCount = 0; // Track how many times card has been flipped
        this.lastFlippedTime = null; // Timestamp of last flip
    }

    flip() {
        if (this.isMatched) {
            console.warn('Cannot flip matched card');
            return false;
        }
        
        this.isFlipped = !this.isFlipped;
        this.flipCount++;
        this.lastFlippedTime = Date.now();
        return true;
    }

    match() {
        this.isMatched = true;
        this.isFlipped = true;
    }

    reset() {
        this.isFlipped = false;
        this.isMatched = false;
        this.flipCount = 0;
        this.lastFlippedTime = null;
    }

    canFlip() {
        return !this.isMatched && !this.isFlipped;
    }

    getStats() {
        return {
            id: this.id,
            emoji: this.emoji,
            isFlipped: this.isFlipped,
            isMatched: this.isMatched,
            flipCount: this.flipCount,
            pairId: this.pairId
        };
    }

    // Validation
    isValid() {
        return this.emoji && 
               typeof this.id === 'number' && 
               typeof this.row === 'number' && 
               typeof this.col === 'number';
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
        this.gameStartTime = null;
        this.totalGameTime = 0;
        this.bestTime = null;
        this.wins = 0;
        this.losses = 0;
        this.ties = 0;
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
            isAI: this.isAI,
            totalGameTime: this.totalGameTime,
            bestTime: this.bestTime,
            wins: this.wins,
            losses: this.losses,
            ties: this.ties
        };
    }

    // Game session management
    startGame() {
        this.gameStartTime = Date.now();
    }

    endGame() {
        if (this.gameStartTime) {
            const gameTime = Date.now() - this.gameStartTime;
            this.totalGameTime += gameTime;
            
            if (!this.bestTime || gameTime < this.bestTime) {
                this.bestTime = gameTime;
            }
            
            this.gameStartTime = null;
        }
    }

    // Win/Loss tracking
    recordWin() {
        this.wins++;
    }

    recordLoss() {
        this.losses++;
    }

    recordTie() {
        this.ties++;
    }

    // Validation
    isValid() {
        return this.name && 
               this.color && 
               typeof this.score === 'number' &&
               typeof this.matches === 'number' &&
               typeof this.moves === 'number';
    }

    // Color validation
    static isValidColor(color) {
        const validColors = ['red', 'yellow', 'green', 'blue'];
        return validColors.includes(color);
    }
}
