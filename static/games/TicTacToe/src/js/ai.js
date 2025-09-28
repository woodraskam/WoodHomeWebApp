// Tic Tac Toe - AI Logic

// Make AI move
function makeAIMove() {
    if (!isAITurn()) {
        console.log('⚠️ Not AI turn, ignoring AI move request');
        return;
    }
    
    const gameMode = getGameMode();
    const difficulty = gameMode.split('-')[2]; // 'easy' or 'hard'
    
    console.log(`🤖 AI (${difficulty}) making move...`);
    
    // Show AI thinking indicator
    showAIThinking();
    
    // Calculate AI move based on difficulty
    let move;
    if (difficulty === 'easy') {
        move = getEasyAIMove();
    } else {
        move = getHardAIMove();
    }
    
    // Make the move after thinking delay
    setTimeout(() => {
        hideAIThinking();
        
        if (move !== null && makeMove(move)) {
            // Update the UI
            updateCellDisplay(move);
            
            // Play sound effect
            playSoundEffect('move');
            
            // Add visual feedback
            addCellAnimation(move);
            
            console.log(`🤖 AI moved to position ${move}`);
        } else {
            console.error('❌ AI move failed');
        }
    }, gameState.settings.aiThinkingDelay ? gameState.aiConfig[difficulty].thinkTime : 0);
}

// Get easy AI move (random)
function getEasyAIMove() {
    const board = getGameBoard();
    const availableMoves = [];
    
    // Find all empty cells
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }
    
    // Return random available move
    if (availableMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }
    
    return null;
}

// Get hard AI move (minimax algorithm)
function getHardAIMove() {
    const board = getGameBoard();
    const availableMoves = [];
    
    // Find all empty cells
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }
    
    if (availableMoves.length === 0) {
        return null;
    }
    
    // If only one move available, take it
    if (availableMoves.length === 1) {
        return availableMoves[0];
    }
    
    // Use minimax algorithm to find best move
    let bestMove = availableMoves[0];
    let bestScore = -Infinity;
    
    for (let move of availableMoves) {
        // Make the move
        board[move] = 'O';
        
        // Calculate score for this move
        const score = minimax(board, 0, false);
        
        // Undo the move
        board[move] = '';
        
        // Update best move if this is better
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    console.log(`🧠 AI calculated best move: ${bestMove} (score: ${bestScore})`);
    return bestMove;
}

// Minimax algorithm for optimal AI play
function minimax(board, depth, isMaximizing) {
    // Check for terminal states
    const result = checkGameResult();
    
    if (result.winner) {
        // Return score based on winner
        if (result.winner === 'O') {
            return 10 - depth; // AI wins
        } else {
            return depth - 10; // Human wins
        }
    }
    
    if (result.draw) {
        return 0; // Draw
    }
    
    if (isMaximizing) {
        // AI's turn - maximize score
        let bestScore = -Infinity;
        
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        
        return bestScore;
    } else {
        // Human's turn - minimize score
        let bestScore = Infinity;
        
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        
        return bestScore;
    }
}

// Show AI thinking indicator
function showAIThinking() {
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.textContent = 'AI is thinking...';
        statusEl.classList.add('ai-thinking');
    }
    
    // Add thinking animation to board
    const board = document.getElementById('tic-tac-toe-board');
    if (board) {
        board.classList.add('ai-thinking');
    }
}

// Hide AI thinking indicator
function hideAIThinking() {
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.classList.remove('ai-thinking');
    }
    
    // Remove thinking animation from board
    const board = document.getElementById('tic-tac-toe-board');
    if (board) {
        board.classList.remove('ai-thinking');
    }
}

// Get AI move with some randomness for more interesting gameplay
function getSmartAIMove() {
    const board = getGameBoard();
    const availableMoves = [];
    
    // Find all empty cells
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }
    
    if (availableMoves.length === 0) {
        return null;
    }
    
    // Check for immediate win
    for (let move of availableMoves) {
        board[move] = 'O';
        const result = checkGameResult();
        board[move] = '';
        
        if (result.winner === 'O') {
            console.log('🎯 AI found winning move');
            return move;
        }
    }
    
    // Check for immediate block
    for (let move of availableMoves) {
        board[move] = 'X';
        const result = checkGameResult();
        board[move] = '';
        
        if (result.winner === 'X') {
            console.log('🛡️ AI found blocking move');
            return move;
        }
    }
    
    // Prefer center
    if (availableMoves.includes(4)) {
        console.log('🎯 AI choosing center');
        return 4;
    }
    
    // Prefer corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => availableMoves.includes(corner));
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        console.log('🎯 AI choosing corner');
        return randomCorner;
    }
    
    // Choose random available move
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    console.log('🎲 AI choosing random move');
    return availableMoves[randomIndex];
}

// Get AI difficulty description
function getAIDifficultyDescription(difficulty) {
    const descriptions = {
        easy: 'Makes random moves - good for beginners',
        hard: 'Uses advanced strategy - very challenging'
    };
    
    return descriptions[difficulty] || 'Unknown difficulty';
}

// Check if AI can win in one move
function canAIWin() {
    const board = getGameBoard();
    
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            const result = checkGameResult();
            board[i] = '';
            
            if (result.winner === 'O') {
                return i;
            }
        }
    }
    
    return null;
}

// Check if AI needs to block human win
function needsToBlock() {
    const board = getGameBoard();
    
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'X';
            const result = checkGameResult();
            board[i] = '';
            
            if (result.winner === 'X') {
                return i;
            }
        }
    }
    
    return null;
}

// Get strategic move priority
function getStrategicMove() {
    const board = getGameBoard();
    const availableMoves = [];
    
    // Find all empty cells
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            availableMoves.push(i);
        }
    }
    
    if (availableMoves.length === 0) {
        return null;
    }
    
    // Priority order: center, corners, edges
    const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    
    for (let priority of priorities) {
        if (availableMoves.includes(priority)) {
            return priority;
        }
    }
    
    return availableMoves[0];
}

// Make functions globally accessible
window.makeAIMove = makeAIMove;
window.getEasyAIMove = getEasyAIMove;
window.getHardAIMove = getHardAIMove;
window.getSmartAIMove = getSmartAIMove;
window.minimax = minimax;
window.showAIThinking = showAIThinking;
window.hideAIThinking = hideAIThinking;
window.getAIDifficultyDescription = getAIDifficultyDescription;
window.canAIWin = canAIWin;
window.needsToBlock = needsToBlock;
window.getStrategicMove = getStrategicMove;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        makeAIMove,
        getEasyAIMove,
        getHardAIMove,
        getSmartAIMove,
        minimax,
        showAIThinking,
        hideAIThinking,
        getAIDifficultyDescription,
        canAIWin,
        needsToBlock,
        getStrategicMove
    };
}
