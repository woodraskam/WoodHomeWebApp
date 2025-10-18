// Connect Four - AI Logic

class ConnectFourAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth();
        this.gameLogic = new ConnectFourLogic();
    }
    
    getMaxDepth() {
        switch (this.difficulty) {
            case 'easy':
                return 3;
            case 'medium':
                return 5;
            case 'hard':
                return 7;
            default:
                return 5;
        }
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth();
    }
    
    // Get the best move for the AI
    getBestMove(board, player) {
        this.gameLogic.setBoard(board);
        const validMoves = this.gameLogic.getValidMoves();
        
        if (validMoves.length === 0) {
            return null;
        }
        
        // For easy difficulty, use random moves
        if (this.difficulty === 'easy') {
            return this.getRandomMove(validMoves);
        }
        
        // For medium and hard, use minimax
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of validMoves) {
            // Make the move
            this.gameLogic.makeMove(move.col, move.row, player);
            
            // Evaluate the move
            const score = this.minimax(0, false, player, -Infinity, Infinity);
            
            // Undo the move
            this.gameLogic.undoMove(move.col, move.row);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    // Minimax algorithm with alpha-beta pruning
    minimax(depth, isMaximizing, player, alpha, beta) {
        // Terminal conditions
        if (depth === this.maxDepth) {
            return this.gameLogic.evaluatePosition();
        }
        
        const validMoves = this.gameLogic.getValidMoves();
        if (validMoves.length === 0) {
            return 0; // Draw
        }
        
        // Check for immediate win/loss
        for (const move of validMoves) {
            this.gameLogic.makeMove(move.col, move.row, player);
            if (this.gameLogic.checkWin(move.col, move.row)) {
                this.gameLogic.undoMove(move.col, move.row);
                return isMaximizing ? 1000 - depth : -1000 + depth;
            }
            this.gameLogic.undoMove(move.col, move.row);
        }
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of validMoves) {
                this.gameLogic.makeMove(move.col, move.row, player);
                const score = this.minimax(depth + 1, false, player === 'red' ? 'yellow' : 'red', alpha, beta);
                this.gameLogic.undoMove(move.col, move.row);
                
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                
                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of validMoves) {
                this.gameLogic.makeMove(move.col, move.row, player);
                const score = this.minimax(depth + 1, true, player === 'red' ? 'yellow' : 'red', alpha, beta);
                this.gameLogic.undoMove(move.col, move.row);
                
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                
                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }
            return minScore;
        }
    }
    
    // Get a random move (for easy difficulty)
    getRandomMove(validMoves) {
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }
    
    // Evaluate the current board position
    evaluatePosition(board, player) {
        this.gameLogic.setBoard(board);
        return this.gameLogic.evaluatePosition();
    }
    
    // Get opening move (center column is usually best)
    getOpeningMove() {
        const centerColumn = 3;
        return {col: centerColumn, row: 5};
    }
    
    // Check if it's the opening move
    isOpeningMove(board) {
        let moveCount = 0;
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                if (board[col][row] !== null) {
                    moveCount++;
                }
            }
        }
        return moveCount < 4;
    }
    
    // Get strategic move based on game phase
    getStrategicMove(board, player) {
        if (this.isOpeningMove(board)) {
            return this.getOpeningMove();
        }
        
        // Check for immediate win
        const winMove = this.findWinningMove(board, player);
        if (winMove) {
            return winMove;
        }
        
        // Check for opponent's winning move and block it
        const blockMove = this.findWinningMove(board, player === 'red' ? 'yellow' : 'red');
        if (blockMove) {
            return blockMove;
        }
        
        // Use minimax for other moves
        return this.getBestMove(board, player);
    }
    
    // Find a winning move for a player
    findWinningMove(board, player) {
        this.gameLogic.setBoard(board);
        const validMoves = this.gameLogic.getValidMoves();
        
        for (const move of validMoves) {
            this.gameLogic.makeMove(move.col, move.row, player);
            if (this.gameLogic.checkWin(move.col, move.row)) {
                this.gameLogic.undoMove(move.col, move.row);
                return move;
            }
            this.gameLogic.undoMove(move.col, move.row);
        }
        
        return null;
    }
    
    // Get move with thinking delay (for better UX)
    getMoveWithDelay(board, player, callback) {
        const thinkingTime = this.getThinkingTime();
        
        setTimeout(() => {
            const move = this.getStrategicMove(board, player);
            callback(move);
        }, thinkingTime);
    }
    
    // Get thinking time based on difficulty
    getThinkingTime() {
        switch (this.difficulty) {
            case 'easy':
                return 500 + Math.random() * 1000; // 0.5-1.5 seconds
            case 'medium':
                return 1000 + Math.random() * 2000; // 1-3 seconds
            case 'hard':
                return 2000 + Math.random() * 3000; // 2-5 seconds
            default:
                return 1000;
        }
    }
}
