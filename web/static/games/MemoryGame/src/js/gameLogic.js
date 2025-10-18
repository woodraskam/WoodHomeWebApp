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
        
        // Update game state cards
        for (let i = 0; i < totalCards; i++) {
            this.gameState.cards[i].emoji = cardPairs[i].emoji;
            this.gameState.cards[i].pairId = cardPairs[i].pairId;
        }
    }

    shuffleCards() {
        const totalCards = this.gameState.gridSize * this.gameState.gridSize;
        
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
            return { isMatch: false, isMismatch: false };
        }
        
        const [card1Index, card2Index] = this.gameState.flippedCards;
        const card1 = this.gameState.cards[card1Index];
        const card2 = this.gameState.cards[card2Index];
        
        if (card1.emoji === card2.emoji) {
            // Match found!
            this.gameState.markCardsAsMatched();
            
            // Update current player's score
            const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
            if (currentPlayer) {
                currentPlayer.addMatch();
            }
            
            return { isMatch: true, isMismatch: false };
        } else {
            // Mismatch
            return { isMatch: false, isMismatch: true };
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

    // AI helper methods
    getAIMove() {
        // Simple AI: try to find a match if we have one card flipped
        if (this.gameState.flippedCards.length === 1) {
            const flippedCard = this.gameState.cards[this.gameState.flippedCards[0]];
            const targetEmoji = flippedCard.emoji;
            
            // Look for matching card
            for (let i = 0; i < this.gameState.cards.length; i++) {
                if (i !== this.gameState.flippedCards[0] && 
                    !this.gameState.cards[i].isFlipped && 
                    !this.gameState.cards[i].isMatched &&
                    this.gameState.cards[i].emoji === targetEmoji) {
                    return i;
                }
            }
        }
        
        // If no match found or no cards flipped, pick a random available card
        const availableCards = [];
        for (let i = 0; i < this.gameState.cards.length; i++) {
            if (!this.gameState.cards[i].isFlipped && !this.gameState.cards[i].isMatched) {
                availableCards.push(i);
            }
        }
        
        if (availableCards.length > 0) {
            return availableCards[Math.floor(Math.random() * availableCards.length)];
        }
        
        return -1; // No available moves
    }
}
