// Memory Game - Core Game Logic

class MemoryGameLogic {
    constructor(gameState) {
        this.gameState = gameState;
        this.emojiManager = new EmojiManager();
    }

    initializeGame() {
        console.log('Initializing game logic...');
        this.gameState.initializeGame();
        this.generateCardPairs();
        this.shuffleCards();
    }

    resetGame() {
        console.log('Resetting game logic...');
        this.gameState.resetGame();
    }

    updateGridSize(size) {
        console.log('Updating grid size to:', size);
        this.gameState.updateGridSize(size);
    }

    generateCardPairs() {
        const totalCards = this.gameState.gridSize * this.gameState.gridSize;
        const pairs = totalCards / 2;

        // Use emoji manager to generate card pairs
        const cardPairs = this.emojiManager.createCardPairs(this.gameState.gridSize, this.gameState.emojiSet);

        console.log('Generated card pairs:', cardPairs.slice(0, 4)); // Log first 4 pairs

        // Update game state cards
        for (let i = 0; i < totalCards; i++) {
            this.gameState.cards[i].emoji = cardPairs[i].emoji;
            this.gameState.cards[i].pairId = cardPairs[i].pairId;
        }

        console.log('Cards after assignment:', this.gameState.cards.slice(0, 4)); // Log first 4 cards
    }

    shuffleCards() {
        const totalCards = this.gameState.gridSize * this.gameState.gridSize;

        console.log('Before shuffle:', this.gameState.cards.slice(0, 4));

        // Fisher-Yates shuffle algorithm
        for (let i = totalCards - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap emojis
            const tempEmoji = this.gameState.cards[i].emoji;
            this.gameState.cards[i].emoji = this.gameState.cards[j].emoji;
            this.gameState.cards[j].emoji = tempEmoji;

            // Swap pairIds
            const tempPairId = this.gameState.cards[i].pairId;
            this.gameState.cards[i].pairId = this.gameState.cards[j].pairId;
            this.gameState.cards[j].pairId = tempPairId;
        }

        console.log('After shuffle:', this.gameState.cards.slice(0, 4));
    }

    canFlipCard(cardIndex) {
        // Can't flip if game is not active
        if (!this.gameState.isGameActive) {
            return false;
        }

        // Can't flip if card is already flipped or matched
        if (this.gameState.cards[cardIndex].isFlipped || this.gameState.cards[cardIndex].isMatched) {
            return false;
        }

        // Can't flip if already have 2 cards flipped
        if (this.gameState.flippedCards.length >= 2) {
            return false;
        }

        return true;
    }

    flipCard(cardIndex) {
        if (this.canFlipCard(cardIndex)) {
            this.gameState.addFlippedCard(cardIndex);
            this.gameState.moves++;

            // Update current player's move count
            const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
            if (currentPlayer) {
                currentPlayer.addMove();
            }

            return true;
        }
        return false;
    }

    checkMatch() {
        if (this.gameState.flippedCards.length !== 2) {
            return { isMatch: false, isMismatch: false, cards: [] };
        }

        const [card1Index, card2Index] = this.gameState.flippedCards;
        const card1 = this.gameState.cards[card1Index];
        const card2 = this.gameState.cards[card2Index];

        console.log('Checking match between cards:');
        console.log('Card 1:', { emoji: card1.emoji, pairId: card1.pairId, index: card1Index });
        console.log('Card 2:', { emoji: card2.emoji, pairId: card2.pairId, index: card2Index });
        console.log('Emoji match:', card1.emoji === card2.emoji);
        console.log('PairId match:', card1.pairId === card2.pairId);

        if (card1.emoji === card2.emoji && card1.pairId === card2.pairId) {
            // Match found!
            this.gameState.markCardsAsMatched();

            // Update current player's score
            const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
            if (currentPlayer) {
                currentPlayer.addMatch();
            }

            return {
                isMatch: true,
                isMismatch: false,
                cards: [card1Index, card2Index],
                score: this.calculateMatchScore()
            };
        } else {
            // Mismatch
            return {
                isMatch: false,
                isMismatch: true,
                cards: [card1Index, card2Index]
            };
        }
    }

    calculateMatchScore() {
        // Each matched pair is worth 2 points
        return 2;
    }

    getDifficultyMultiplier() {
        switch (this.gameState.difficulty) {
            case 'easy': return 1.0;
            case 'medium': return 1.5;
            case 'hard': return 2.0;
            default: return 1.0;
        }
    }

    flipCardsBack() {
        this.gameState.clearFlippedCards();
    }

    isGameComplete() {
        return this.gameState.isGameComplete();
    }

    getWinner() {
        if (!this.isGameComplete()) {
            return null;
        }

        // Find player with highest score
        let winner = this.gameState.players[0];
        for (let i = 1; i < this.gameState.players.length; i++) {
            if (this.gameState.players[i].score > winner.score) {
                winner = this.gameState.players[i];
            }
        }

        // Check for ties
        const tiedPlayers = this.gameState.players.filter(player => player.score === winner.score);
        if (tiedPlayers.length > 1) {
            return null; // Tie game
        }

        return winner;
    }

    getGameStats() {
        return {
            gameState: this.gameState.getGameStats(),
            players: this.gameState.players.map(player => player.getStats())
        };
    }

    setEmojiSet(setName) {
        if (this.emojiManager.isValidEmojiSet(setName)) {
            this.gameState.emojiSet = setName;
            this.emojiManager.setCurrentSet(setName);
            return true;
        }
        return false;
    }

    getAvailableEmojiSets() {
        return this.emojiManager.getAvailableSets();
    }

    getCurrentEmojiSet() {
        return this.gameState.emojiSet;
    }

    // Game flow management
    startGame() {
        console.log('Starting new game...');

        // Validate game state before starting
        if (!this.gameState.isGameStateValid()) {
            const errors = this.gameState.getValidationErrors();
            console.error('Game state validation failed:', errors);
            return { success: false, errors: errors };
        }

        this.initializeGame();
        this.gameState.isGameActive = true;

        // Start player game sessions
        this.gameState.players.forEach(player => player.startGame());

        return { success: true, errors: [] };
    }

    endGame() {
        console.log('Ending game...');
        this.gameState.isGameActive = false;
        this.gameState.gamePhase = 'finished';

        // End player game sessions
        this.gameState.players.forEach(player => player.endGame());

        return this.getGameResults();
    }

    getGameResults() {
        const winner = this.getWinner();
        const stats = this.getGameStats();

        return {
            winner: winner,
            isTie: winner === null,
            stats: stats,
            completionTime: this.gameState.getGameTime(),
            totalMoves: this.gameState.moves
        };
    }

    // Turn management
    nextTurn() {
        if (!this.gameState.isGameActive) {
            return false;
        }

        // Check if game is complete
        if (this.isGameComplete()) {
            this.endGame();
            return false;
        }

        // Move to next player
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;

        // If next player is AI, trigger AI move
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        if (currentPlayer && currentPlayer.isAI) {
            setTimeout(() => this.executeAIMove(), 1000); // Delay for better UX
        }

        return true;
    }

    executeAIMove() {
        if (!this.gameState.isGameActive) {
            return;
        }

        const aiMove = this.getAIMove();
        if (aiMove !== -1) {
            this.flipCard(aiMove);
        }
    }

    // AI helper methods
    getAIMove() {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        if (!currentPlayer || !currentPlayer.isAI) {
            return -1;
        }

        // AI difficulty-based logic
        switch (currentPlayer.difficulty || 'medium') {
            case 'easy':
                return this.getEasyAIMove();
            case 'medium':
                return this.getMediumAIMove();
            case 'hard':
                return this.getHardAIMove();
            default:
                return this.getMediumAIMove();
        }
    }

    getEasyAIMove() {
        // Random move
        const availableCards = this.getAvailableCards();
        return availableCards.length > 0 ?
            availableCards[Math.floor(Math.random() * availableCards.length)] : -1;
    }

    getMediumAIMove() {
        // Try to find a match if we have one card flipped
        if (this.gameState.flippedCards.length === 1) {
            const flippedCard = this.gameState.cards[this.gameState.flippedCards[0]];
            const matchingCard = this.findMatchingCard(flippedCard.emoji, flippedCard.pairId);
            if (matchingCard !== -1) {
                return matchingCard;
            }
        }

        // Otherwise, random move
        return this.getEasyAIMove();
    }

    getHardAIMove() {
        // Advanced AI with memory
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];

        // Initialize AI memory if not exists
        if (!currentPlayer.memory) {
            currentPlayer.memory = new Map();
        }

        // Try to find a match if we have one card flipped
        if (this.gameState.flippedCards.length === 1) {
            const flippedCard = this.gameState.cards[this.gameState.flippedCards[0]];
            const matchingCard = this.findMatchingCard(flippedCard.emoji, flippedCard.pairId);
            if (matchingCard !== -1) {
                return matchingCard;
            }
        }

        // Use memory to make informed decisions
        const rememberedCard = this.getRememberedCard();
        if (rememberedCard !== -1) {
            return rememberedCard;
        }

        // Fallback to random
        return this.getEasyAIMove();
    }

    findMatchingCard(emoji, pairId) {
        for (let i = 0; i < this.gameState.cards.length; i++) {
            if (i !== this.gameState.flippedCards[0] &&
                !this.gameState.cards[i].isFlipped &&
                !this.gameState.cards[i].isMatched &&
                this.gameState.cards[i].emoji === emoji &&
                this.gameState.cards[i].pairId === pairId) {
                return i;
            }
        }
        return -1;
    }

    getAvailableCards() {
        const availableCards = [];
        for (let i = 0; i < this.gameState.cards.length; i++) {
            if (!this.gameState.cards[i].isFlipped && !this.gameState.cards[i].isMatched) {
                availableCards.push(i);
            }
        }
        return availableCards;
    }

    getRememberedCard() {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        if (!currentPlayer.memory || currentPlayer.memory.size === 0) {
            return -1;
        }

        // Find a card we remember that's not currently flipped
        for (const [cardIndex, cardInfo] of currentPlayer.memory) {
            if (!this.gameState.cards[cardIndex].isFlipped &&
                !this.gameState.cards[cardIndex].isMatched) {
                return cardIndex;
            }
        }

        return -1;
    }
}
