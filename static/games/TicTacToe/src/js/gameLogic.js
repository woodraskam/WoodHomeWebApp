// Tic Tac Toe - Game Logic

// Initialize game logic
function initializeGameLogic() {
    console.log('🎯 Initializing Tic Tac Toe game logic...');
    
    // Create the game board
    createGameBoard();
    
    // Set up event listeners
    setupGameEventListeners();
    
    console.log('✅ Game logic initialized');
}

// Create the 3x3 game board
function createGameBoard() {
    const boardContainer = document.getElementById('tic-tac-toe-board');
    if (!boardContainer) {
        console.error('❌ Game board container not found');
        return;
    }
    
    // Clear existing board
    boardContainer.innerHTML = '';
    
    // Create 9 cells (3x3 grid)
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.className = 'board-cell';
        cell.id = `cell-${i}`;
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        cell.addEventListener('mouseenter', () => handleCellHover(i));
        cell.addEventListener('mouseleave', () => handleCellLeave(i));
        boardContainer.appendChild(cell);
    }
    
    console.log('🎯 Game board created');
}

// Handle cell click
function handleCellClick(cellIndex) {
    if (!isGameActive()) {
        console.log('⚠️ Game not active, ignoring click');
        return;
    }
    
    // Check if it's AI's turn
    if (isAITurn()) {
        console.log('🤖 AI turn, ignoring human click');
        return;
    }
    
    console.log(`🎯 Cell clicked: ${cellIndex}`);
    
    // Make the move
    const moveSuccessful = makeMove(cellIndex);
    
    if (moveSuccessful) {
        // Update the UI
        updateCellDisplay(cellIndex);
        
        // Play sound effect
        playSoundEffect('move');
        
        // Add visual feedback
        addCellAnimation(cellIndex);
    }
}

// Handle cell hover
function handleCellHover(cellIndex) {
    if (!isGameActive() || isAITurn()) return;
    
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (cell && !cell.textContent) {
        cell.style.opacity = '0.7';
        cell.style.transform = 'scale(1.05)';
    }
}

// Handle cell leave
function handleCellLeave(cellIndex) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (cell && !cell.textContent) {
        cell.style.opacity = '1';
        cell.style.transform = 'scale(1)';
    }
}

// Update cell display
function updateCellDisplay(cellIndex) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    
    const currentPlayer = getCurrentPlayer();
    cell.textContent = currentPlayer;
    cell.className = `board-cell ${currentPlayer.toLowerCase()}`;
    cell.disabled = true;
    
    // Add entrance animation
    cell.style.animation = 'cellPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
}

// Add cell animation
function addCellAnimation(cellIndex) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    
    // Add a subtle bounce effect
    cell.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cell.style.transform = 'scale(1)';
    }, 150);
}

// Update current player display
function updateCurrentPlayerDisplay() {
    const currentPlayerEl = document.getElementById('current-player');
    if (!currentPlayerEl) return;
    
    const currentPlayer = getCurrentPlayer();
    const gameMode = getGameMode();
    
    let playerText = `Player ${currentPlayer}'s Turn`;
    
    // Adjust text for AI mode
    if (gameMode !== 'vs-human' && currentPlayer === 'O') {
        const aiConfig = gameState.aiConfig[gameMode.split('-')[2]];
        playerText = `${aiConfig.name}'s Turn`;
    }
    
    currentPlayerEl.textContent = playerText;
    
    // Add visual feedback
    currentPlayerEl.style.animation = 'none';
    setTimeout(() => {
        currentPlayerEl.style.animation = 'pulse 0.5s ease';
    }, 10);
}

// Update game status
function updateGameStatus(message) {
    const statusEl = document.getElementById('game-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    
    // Add visual feedback
    statusEl.style.animation = 'none';
    setTimeout(() => {
        statusEl.style.animation = 'fadeIn 0.3s ease';
    }, 10);
}

// Show winning line
function showWinningLine(winningLine) {
    if (!winningLine) return;
    
    winningLine.forEach(index => {
        const cell = document.getElementById(`cell-${index}`);
        if (cell) {
            cell.classList.add('winning');
        }
    });
    
    console.log('🏆 Winning line highlighted');
}

// Hide winning line
function hideWinningLine() {
    const winningCells = document.querySelectorAll('.board-cell.winning');
    winningCells.forEach(cell => {
        cell.classList.remove('winning');
    });
}

// Reset board display
function resetBoardDisplay() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'board-cell';
        cell.disabled = false;
        cell.style.animation = '';
        cell.style.transform = '';
        cell.style.opacity = '';
    });
    
    hideWinningLine();
    console.log('🔄 Board display reset');
}

// Start game
function startGame() {
    if (!gameState.gameMode) {
        console.error('❌ No game mode selected');
        return;
    }
    
    console.log(`🎮 Starting game in ${gameState.gameMode} mode`);
    
    // Hide start screen
    hideStartScreen();
    
    // Show game board
    showGameBoard();
    
    // Start new game
    startNewGame();
    
    // Update displays
    updateCurrentPlayerDisplay();
    updateGameStatus('Make your move!');
    updateStatsDisplay();
    
    // If AI goes first, make AI move
    if (gameState.gameMode !== 'vs-human' && gameState.currentPlayer === 'O') {
        setTimeout(() => makeAIMove(), 1000);
    }
}

// Hide start screen
function hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('fade-out');
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 500);
    }
}

// Show game board
function showGameBoard() {
    const gameBoard = document.getElementById('game-board');
    if (gameBoard) {
        gameBoard.style.display = 'block';
        gameBoard.classList.add('fade-in');
    }
}

// Show victory screen
function showVictoryScreen(winner, winningLine) {
    const victoryScreen = document.getElementById('victory-screen');
    const victoryTitle = document.getElementById('victory-title');
    const victoryMessage = document.getElementById('victory-message');
    const victoryIcon = document.getElementById('victory-icon');
    
    if (!victoryScreen || !victoryTitle || !victoryMessage || !victoryIcon) {
        console.error('❌ Victory screen elements not found');
        return;
    }
    
    // Show winning line
    if (winningLine) {
        showWinningLine(winningLine);
    }
    
    // Set victory content
    if (winner) {
        victoryIcon.textContent = winner === 'X' ? '❌' : '⭕';
        victoryTitle.textContent = `${winner} WINS!`;
        victoryMessage.textContent = `Congratulations! ${winner} has won the game!`;
    } else {
        victoryIcon.textContent = '🤝';
        victoryTitle.textContent = 'DRAW!';
        victoryMessage.textContent = 'It\'s a tie! Great game!';
    }
    
    // Show victory screen
    victoryScreen.classList.add('show');
    
    // Play victory sound
    playSoundEffect('victory');
    
    // Create confetti effect
    createConfettiEffect();
    
    console.log(`🎉 Victory screen shown: ${winner || 'Draw'}`);
}

// Hide victory screen
function hideVictoryScreen() {
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
        victoryScreen.classList.remove('show');
    }
}

// Play again
function playAgain() {
    console.log('🔄 Playing again...');
    
    // Reset game
    resetGame();
    resetBoardDisplay();
    
    // Hide victory screen
    hideVictoryScreen();
    
    // Update displays
    updateCurrentPlayerDisplay();
    updateGameStatus('Make your move!');
    
    // If AI goes first, make AI move
    if (gameState.gameMode !== 'vs-human' && gameState.currentPlayer === 'O') {
        setTimeout(() => makeAIMove(), 1000);
    }
}

// Go home
function goHome() {
    console.log('🏠 Going home...');
    
    // Reset game state
    gameState.gameMode = null;
    gameState.gameActive = false;
    gameState.gameEnded = false;
    
    // Hide game board
    const gameBoard = document.getElementById('game-board');
    if (gameBoard) {
        gameBoard.style.display = 'none';
    }
    
    // Show start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'block';
        startScreen.classList.remove('fade-out');
    }
    
    // Reset board
    resetBoardDisplay();
    
    // Reset buttons
    document.getElementById('start-game-btn').disabled = true;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

// Setup game event listeners
function setupGameEventListeners() {
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!isGameActive() || isAITurn()) return;
        
        // Number keys 1-9 for board positions
        const keyMap = {
            '1': 0, '2': 1, '3': 2,
            '4': 3, '5': 4, '6': 5,
            '7': 6, '8': 7, '9': 8
        };
        
        if (keyMap[e.key]) {
            handleCellClick(keyMap[e.key]);
        }
        
        // Spacebar to make AI move (for testing)
        if (e.key === ' ' && gameState.gameMode !== 'vs-human') {
            e.preventDefault();
            if (isAITurn()) {
                makeAIMove();
            }
        }
    });
    
    console.log('🎮 Game event listeners setup');
}

// Make functions globally accessible
window.initializeGameLogic = initializeGameLogic;
window.createGameBoard = createGameBoard;
window.handleCellClick = handleCellClick;
window.updateCellDisplay = updateCellDisplay;
window.updateCurrentPlayerDisplay = updateCurrentPlayerDisplay;
window.updateGameStatus = updateGameStatus;
window.showWinningLine = showWinningLine;
window.hideWinningLine = hideWinningLine;
window.resetBoardDisplay = resetBoardDisplay;
window.startGame = startGame;
window.showVictoryScreen = showVictoryScreen;
window.hideVictoryScreen = hideVictoryScreen;
window.playAgain = playAgain;
window.goHome = goHome;
window.hideStartScreen = hideStartScreen;
window.showGameBoard = showGameBoard;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeGameLogic,
        createGameBoard,
        handleCellClick,
        updateCellDisplay,
        updateCurrentPlayerDisplay,
        updateGameStatus,
        showWinningLine,
        hideWinningLine,
        resetBoardDisplay,
        startGame,
        showVictoryScreen,
        hideVictoryScreen,
        playAgain,
        goHome
    };
}
