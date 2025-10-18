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
        const emojiSetSelect = document.getElementById('emojiSet');
        const difficultySelect = document.getElementById('difficulty');
        
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
        
        if (emojiSetSelect) {
            emojiSetSelect.addEventListener('change', (e) => {
                this.changeEmojiSet(e.target.value);
            });
        }
        
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.changeDifficulty(e.target.value);
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
        
        // Use the enhanced startGame method
        const result = this.gameLogic.startGame();
        
        if (result.success) {
            this.updateGameDisplay();
            this.updatePlayerDisplay();
            this.showGameStats();
            this.startGameTimer();
            this.updateGameStatus('Game started! Click cards to find matches!');
        } else {
            console.error('Failed to start game:', result.errors);
            this.updateGameStatus('Error starting game. Please check settings.');
        }
    }

    resetGame() {
        console.log('Resetting game...');
        this.stopGameTimer();
        this.gameLogic.resetGame();
        this.updateGameDisplay();
        this.updatePlayerDisplay();
        this.hideGameStats();
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

    changeEmojiSet(emojiSet) {
        console.log('Changing emoji set to:', emojiSet);
        if (this.gameLogic.setEmojiSet(emojiSet)) {
            this.gameState.emojiSet = emojiSet;
            this.updateGameStatus(`Emoji theme changed to ${emojiSet}`);
        } else {
            this.updateGameStatus('Invalid emoji set selected');
        }
    }

    changeDifficulty(difficulty) {
        console.log('Changing difficulty to:', difficulty);
        this.gameState.difficulty = difficulty;
        this.updateGameStatus(`Difficulty changed to ${difficulty}`);
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
            this.updatePlayerScore(result.score);
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

    updatePlayerScore(score = 10) {
        const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
        currentPlayer.score += score;
        currentPlayer.matches++;
        this.updatePlayerScores();
        
        // Add score pop animation
        const scoreElement = document.querySelector('.player-score.active');
        if (scoreElement) {
            this.animations.showScorePop(scoreElement);
        }
    }

    nextPlayer() {
        const success = this.gameLogic.nextTurn();
        if (success) {
            this.updatePlayerDisplay();
            this.updateGameStatus(`${this.gameState.players[this.gameState.currentPlayer].name}'s turn`);
        }
    }

    checkGameComplete() {
        if (this.gameLogic.isGameComplete()) {
            const results = this.gameLogic.endGame();
            this.stopGameTimer();
            this.animations.playVictorySequence();
            setTimeout(() => {
                this.showVictoryScreen(results);
            }, 2000);
        } else {
            this.nextPlayer();
        }
    }

    showVictoryScreen(results = null) {
        const victoryScreen = document.getElementById('victory-screen');
        const victoryTitle = document.getElementById('victory-title');
        const victoryMessage = document.getElementById('victory-message');
        const victoryIcon = document.getElementById('victory-icon');
        
        if (victoryScreen && victoryTitle && victoryMessage && victoryIcon) {
            if (results) {
                if (results.winner) {
                    victoryIcon.innerHTML = `<div class="player-indicator ${results.winner.color}"></div>`;
                    victoryTitle.textContent = `${results.winner.name} Wins!`;
                    victoryMessage.textContent = `Congratulations! ${results.winner.name} found the most matches! Score: ${results.winner.score}`;
                } else {
                    victoryIcon.innerHTML = '🤝';
                    victoryTitle.textContent = 'Tie Game!';
                    victoryMessage.textContent = `Great game! It's a tie! Completion time: ${Math.floor(results.completionTime / 60)}:${(results.completionTime % 60).toString().padStart(2, '0')}`;
                }
            } else {
                // Fallback to old method
                const winner = this.gameLogic.getWinner();
                if (winner) {
                    victoryIcon.innerHTML = `<div class="player-indicator ${winner.color}"></div>`;
                    victoryTitle.textContent = `${winner.name} Wins!`;
                    victoryMessage.textContent = `Congratulations! ${winner.name} found the most matches!`;
                } else {
                    victoryIcon.innerHTML = '🤝';
                    victoryTitle.textContent = 'Tie Game!';
                    victoryMessage.textContent = 'Great game! It\'s a tie!';
                }
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

    // Game Statistics Methods
    showGameStats() {
        const gameStats = document.getElementById('gameStats');
        if (gameStats) {
            gameStats.style.display = 'flex';
        }
    }

    hideGameStats() {
        const gameStats = document.getElementById('gameStats');
        if (gameStats) {
            gameStats.style.display = 'none';
        }
    }

    updateGameStats() {
        const moveCount = document.getElementById('moveCount');
        const gameTime = document.getElementById('gameTime');
        const matchCount = document.getElementById('matchCount');
        const accuracy = document.getElementById('accuracy');

        if (moveCount) {
            moveCount.textContent = this.gameState.moves;
        }
        
        if (gameTime) {
            const time = this.gameState.getGameTime();
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            gameTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (matchCount) {
            matchCount.textContent = this.gameState.matchedPairs;
        }
        
        if (accuracy) {
            const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
            if (currentPlayer && currentPlayer.moves > 0) {
                const accuracyPercent = Math.round((currentPlayer.matches / currentPlayer.moves) * 100);
                accuracy.textContent = `${accuracyPercent}%`;
            } else {
                accuracy.textContent = '0%';
            }
        }
    }

    startGameTimer() {
        // Clear any existing timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // Start new timer
        this.gameTimer = setInterval(() => {
            this.updateGameStats();
        }, 1000);
    }

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
    
    // Make game instance globally accessible for debugging
    window.memoryGame = game;
});
