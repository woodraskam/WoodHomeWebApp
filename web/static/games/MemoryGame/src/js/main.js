// Memory Game - Main Application Entry Point

class MemoryGame {
    constructor() {
        this.gameState = null;
        this.gameLogic = null;
        this.animations = null;
        this.playerManager = null;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        console.log('Initializing Memory Game...');
        
        // Initialize game components
        this.gameState = new MemoryGameState();
        this.gameLogic = new MemoryGameLogic(this.gameState);
        this.animations = new MemoryGameAnimations();
        this.playerManager = new PlayerManager(this.gameState);
        
        // Set default game settings
        this.gameState.gridSize = 4;
        this.gameState.players = [
            new Player('Player 1', 'red', false),
            new Player('Player 2', 'yellow', false)
        ];
        
        // Initialize UI
        this.updateGameDisplay();
        this.updatePlayerDisplay();
        this.updateGameStatus('Click New Game to start!');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Control buttons
        const newGameBtn = document.getElementById('newGameBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }

        // Settings
        const gridSizeSelect = document.getElementById('gridSize');
        const playerCountSelect = document.getElementById('playerCount');
        
        if (gridSizeSelect) {
            gridSizeSelect.addEventListener('change', (e) => {
                this.changeGridSize(parseInt(e.target.value));
            });
        }
        
        if (playerCountSelect) {
            playerCountSelect.addEventListener('change', (e) => {
                this.changePlayerCount(parseInt(e.target.value));
            });
        }

        // Victory screen buttons
        const playAgainBtn = document.getElementById('play-again-btn');
        const goHomeBtn = document.getElementById('go-home-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        
        if (goHomeBtn) {
            goHomeBtn.addEventListener('click', () => this.goHome());
        }
    }

    newGame() {
        console.log('Starting new game...');
        this.gameLogic.initializeGame();
        this.updateGameDisplay();
        this.updatePlayerDisplay();
        this.updateGameStatus('Game started! Click cards to find matches!');
    }

    resetGame() {
        console.log('Resetting game...');
        this.gameLogic.resetGame();
        this.updateGameDisplay();
        this.updatePlayerDisplay();
        this.updateGameStatus('Game reset! Click New Game to start!');
    }

    changeGridSize(size) {
        console.log('Changing grid size to:', size);
        this.gameState.gridSize = size;
        this.gameLogic.updateGridSize(size);
        this.updateGameDisplay();
        this.updateGameStatus(`Grid size changed to ${size}x${size}`);
    }

    changePlayerCount(count) {
        console.log('Changing player count to:', count);
        this.playerManager.setPlayerCount(count);
        this.updatePlayerDisplay();
        this.updateGameStatus(`Player count changed to ${count}`);
    }

    updateGameDisplay() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;

        // Clear existing cards
        gameBoard.innerHTML = '';
        
        // Set grid class
        gameBoard.className = `game-board grid-${this.gameState.gridSize}x${this.gameState.gridSize}`;
        
        // Create cards
        this.createCards();
    }

    createCards() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;

        const totalCards = this.gameState.gridSize * this.gameState.gridSize;
        const pairs = totalCards / 2;
        
        // Generate emoji pairs
        const emojis = this.getEmojiSet();
        const cardEmojis = [];
        
        for (let i = 0; i < pairs; i++) {
            const emoji = emojis[i % emojis.length];
            cardEmojis.push(emoji, emoji); // Add pair
        }
        
        // Shuffle cards
        this.shuffleArray(cardEmojis);
        
        // Create card elements
        for (let i = 0; i < totalCards; i++) {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.dataset.emoji = cardEmojis[i];
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">${cardEmojis[i]}</div>
                    <div class="card-back">?</div>
                </div>
            `;
            
            // Add click event
            card.addEventListener('click', () => this.handleCardClick(card, i));
            
            gameBoard.appendChild(card);
        }
    }

    handleCardClick(cardElement, cardIndex) {
        if (!this.gameLogic.canFlipCard(cardIndex)) {
            return;
        }
        
        this.gameLogic.flipCard(cardIndex);
        this.animations.flipCard(cardElement);
        
        // Check for match after a short delay
        setTimeout(() => {
            this.checkForMatch();
        }, 600);
    }

    checkForMatch() {
        const result = this.gameLogic.checkMatch();
        
        if (result.isMatch) {
            this.animations.showMatch();
            this.updatePlayerScore();
            this.checkGameComplete();
        } else if (result.isMismatch) {
            this.animations.showMismatch();
            setTimeout(() => {
                this.gameLogic.flipCardsBack();
                this.animations.flipCardsBack();
                this.nextPlayer();
            }, 1000);
        }
    }

    updatePlayerDisplay() {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        const playerIndicator = document.querySelector('.player-indicator');
        const playerName = document.querySelector('.player-name');
        
        if (playerIndicator && playerName) {
            playerIndicator.className = `player-indicator ${currentPlayer.color}`;
            playerName.textContent = currentPlayer.name;
        }
        
        this.updatePlayerScores();
    }

    updatePlayerScores() {
        const scoresContainer = document.querySelector('.player-scores');
        if (!scoresContainer) return;
        
        scoresContainer.innerHTML = '';
        
        this.gameState.players.forEach((player, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = `player-score ${index === this.gameState.currentPlayer ? 'active' : ''}`;
            scoreElement.innerHTML = `
                <div class="player-indicator ${player.color}"></div>
                <span>${player.name}: ${player.score}</span>
            `;
            scoresContainer.appendChild(scoreElement);
        });
    }

    updatePlayerScore() {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        currentPlayer.score += 10; // Points per match
        currentPlayer.matches++;
        this.updatePlayerScores();
    }

    nextPlayer() {
        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
        this.updatePlayerDisplay();
        this.updateGameStatus(`${this.gameState.players[this.gameState.currentPlayer].name}'s turn`);
    }

    checkGameComplete() {
        if (this.gameLogic.isGameComplete()) {
            this.showVictoryScreen();
        } else {
            this.nextPlayer();
        }
    }

    showVictoryScreen() {
        const winner = this.gameLogic.getWinner();
        const victoryScreen = document.getElementById('victory-screen');
        const victoryTitle = document.getElementById('victory-title');
        const victoryMessage = document.getElementById('victory-message');
        const victoryIcon = document.getElementById('victory-icon');
        
        if (victoryScreen && victoryTitle && victoryMessage && victoryIcon) {
            if (winner) {
                victoryIcon.innerHTML = `<div class="player-indicator ${winner.color}"></div>`;
                victoryTitle.textContent = `${winner.name} Wins!`;
                victoryMessage.textContent = `Congratulations! ${winner.name} found the most matches!`;
            } else {
                victoryIcon.innerHTML = '🤝';
                victoryTitle.textContent = 'Tie Game!';
                victoryMessage.textContent = 'Great game! It\'s a tie!';
            }
            
            victoryScreen.classList.add('show');
        }
    }

    hideVictoryScreen() {
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.classList.remove('show');
        }
    }

    playAgain() {
        this.hideVictoryScreen();
        this.newGame();
    }

    goHome() {
        window.location.href = '/';
    }

    updateGameStatus(message) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            const statusMessage = statusElement.querySelector('.status-message');
            if (statusMessage) {
                statusMessage.textContent = message;
                statusMessage.classList.add('updating');
                setTimeout(() => {
                    statusMessage.classList.remove('updating');
                }, 300);
            }
        }
    }

    getEmojiSet() {
        // Default emoji set - can be expanded
        return [
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
            '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
        ];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    
    // Make game instance globally accessible for debugging
    window.memoryGame = game;
});
