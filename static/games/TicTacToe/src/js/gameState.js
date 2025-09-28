// Tic Tac Toe - Game State Management

// Game state object
let gameState = {
    // Game configuration
    gameMode: null, // 'vs-human', 'vs-ai-easy', 'vs-ai-hard'
    currentPlayer: 'X', // 'X' or 'O'
    gameBoard: ['', '', '', '', '', '', '', '', ''], // 3x3 grid as array
    gameActive: false,
    gameEnded: false,
    winner: null,
    winningLine: null,
    
    // Statistics
    stats: {
        xWins: 0,
        oWins: 0,
        draws: 0
    },
    
    // AI configuration
    aiConfig: {
        easy: {
            name: 'Easy AI',
            difficulty: 'easy',
            thinkTime: 1000 // 1 second delay
        },
        hard: {
            name: 'Hard AI',
            difficulty: 'hard',
            thinkTime: 1500 // 1.5 second delay
        }
    },
    
    // Game settings
    settings: {
        soundEnabled: true,
        animationsEnabled: true,
        aiThinkingDelay: true
    }
};

// Initialize game state
function initializeGameState() {
    console.log('🎯 Initializing Tic Tac Toe game state...');
    
    // Reset game state
    gameState.currentPlayer = 'X';
    gameState.gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameState.gameActive = false;
    gameState.gameEnded = false;
    gameState.winner = null;
    gameState.winningLine = null;
    
    // Load saved statistics
    loadGameStats();
    
    console.log('✅ Game state initialized');
}

// Save game statistics to localStorage
function saveGameStats() {
    try {
        localStorage.setItem('tictactoe-stats', JSON.stringify(gameState.stats));
        console.log('📊 Game statistics saved');
    } catch (error) {
        console.warn('⚠️ Could not save game statistics:', error);
    }
}

// Load game statistics from localStorage
function loadGameStats() {
    try {
        const savedStats = localStorage.getItem('tictactoe-stats');
        if (savedStats) {
            gameState.stats = { ...gameState.stats, ...JSON.parse(savedStats) };
            console.log('📊 Game statistics loaded:', gameState.stats);
        }
    } catch (error) {
        console.warn('⚠️ Could not load game statistics:', error);
    }
}

// Update statistics display
function updateStatsDisplay() {
    const xWinsEl = document.getElementById('x-wins');
    const oWinsEl = document.getElementById('o-wins');
    const drawsEl = document.getElementById('draws');
    
    if (xWinsEl) xWinsEl.textContent = gameState.stats.xWins;
    if (oWinsEl) oWinsEl.textContent = gameState.stats.oWins;
    if (drawsEl) drawsEl.textContent = gameState.stats.draws;
}

// Set game mode
function setGameMode(mode) {
    gameState.gameMode = mode;
    console.log(`🎮 Game mode set to: ${mode}`);
}

// Get current player
function getCurrentPlayer() {
    return gameState.currentPlayer;
}

// Switch current player
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    console.log(`👤 Current player: ${gameState.currentPlayer}`);
}

// Make a move on the board
function makeMove(cellIndex) {
    if (!gameState.gameActive || gameState.gameEnded || gameState.gameBoard[cellIndex] !== '') {
        return false;
    }
    
    // Make the move
    gameState.gameBoard[cellIndex] = gameState.currentPlayer;
    console.log(`🎯 Move made: ${gameState.currentPlayer} at position ${cellIndex}`);
    
    // Check for win or draw
    const gameResult = checkGameResult();
    
    if (gameResult.winner) {
        endGame(gameResult.winner, gameResult.winningLine);
    } else if (gameResult.draw) {
        endGame(null, null);
    } else {
        // Switch player for next turn
        switchPlayer();
        updateCurrentPlayerDisplay();
        
        // If AI's turn, make AI move
        if (gameState.gameMode !== 'vs-human' && gameState.currentPlayer === 'O') {
            setTimeout(() => makeAIMove(), gameState.settings.aiThinkingDelay ? gameState.aiConfig[gameState.gameMode.split('-')[2]].thinkTime : 0);
        }
    }
    
    return true;
}

// Check game result (win, draw, or continue)
function checkGameResult() {
    const board = gameState.gameBoard;
    const winningLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    // Check for winner
    for (let line of winningLines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], winningLine: line };
        }
    }
    
    // Check for draw
    const isDraw = board.every(cell => cell !== '');
    if (isDraw) {
        return { draw: true };
    }
    
    return { continue: true };
}

// End the game
function endGame(winner, winningLine) {
    gameState.gameActive = false;
    gameState.gameEnded = true;
    gameState.winner = winner;
    gameState.winningLine = winningLine;
    
    // Update statistics
    if (winner) {
        if (winner === 'X') {
            gameState.stats.xWins++;
        } else {
            gameState.stats.oWins++;
        }
    } else {
        gameState.stats.draws++;
    }
    
    // Save statistics
    saveGameStats();
    updateStatsDisplay();
    
    console.log(`🏁 Game ended. Winner: ${winner || 'Draw'}`);
    
    // Show victory screen
    showVictoryScreen(winner, winningLine);
}

// Reset the game
function resetGame() {
    gameState.currentPlayer = 'X';
    gameState.gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameState.gameActive = true;
    gameState.gameEnded = false;
    gameState.winner = null;
    gameState.winningLine = null;
    
    console.log('🔄 Game reset');
}

// Start a new game
function startNewGame() {
    resetGame();
    updateCurrentPlayerDisplay();
    updateGameStatus('Make your move!');
    hideVictoryScreen();
    console.log('🎮 New game started');
}

// Get game board
function getGameBoard() {
    return gameState.gameBoard;
}

// Check if game is active
function isGameActive() {
    return gameState.gameActive && !gameState.gameEnded;
}

// Get game mode
function getGameMode() {
    return gameState.gameMode;
}

// Check if it's AI's turn
function isAITurn() {
    return gameState.gameMode !== 'vs-human' && 
           gameState.currentPlayer === 'O' && 
           isGameActive();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameState,
        initializeGameState,
        setGameMode,
        getCurrentPlayer,
        makeMove,
        resetGame,
        startNewGame,
        getGameBoard,
        isGameActive,
        getGameMode,
        isAITurn
    };
}
