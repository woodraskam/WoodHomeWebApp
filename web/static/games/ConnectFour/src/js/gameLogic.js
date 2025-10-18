// Connect Four - Game Logic and Win Detection

class ConnectFourLogic {
    constructor() {
        this.board = Array(7).fill(null).map(() => Array(6).fill(null));
        this.winningCells = [];
    }
    
    // Check if a move results in a win
    checkWin(columnIndex, row) {
        const player = this.board[columnIndex][row];
        this.winningCells = [];
        
        // Check all four directions
        if (this.checkDirection(columnIndex, row, player, 1, 0) ||  // Horizontal
            this.checkDirection(columnIndex, row, player, 0, 1) ||  // Vertical
            this.checkDirection(columnIndex, row, player, 1, 1) ||  // Diagonal \
            this.checkDirection(columnIndex, row, player, 1, -1)) { // Diagonal /
            return true;
        }
        
        return false;
    }
    
    // Check for win in a specific direction
    checkDirection(columnIndex, row, player, deltaCol, deltaRow) {
        let count = 1;
        this.winningCells = [{col: columnIndex, row: row}];
        
        // Check in positive direction
        let currentCol = columnIndex + deltaCol;
        let currentRow = row + deltaRow;
        while (this.isValidCell(currentCol, currentRow) && 
               this.board[currentCol][currentRow] === player) {
            count++;
            this.winningCells.push({col: currentCol, row: currentRow});
            currentCol += deltaCol;
            currentRow += deltaRow;
        }
        
        // Check in negative direction
        currentCol = columnIndex - deltaCol;
        currentRow = row - deltaRow;
        while (this.isValidCell(currentCol, currentRow) && 
               this.board[currentCol][currentRow] === player) {
            count++;
            this.winningCells.unshift({col: currentCol, row: currentRow});
            currentCol -= deltaCol;
            currentRow -= deltaRow;
        }
        
        return count >= 4;
    }
    
    // Check if coordinates are within board bounds
    isValidCell(columnIndex, row) {
        return columnIndex >= 0 && columnIndex < 7 && 
               row >= 0 && row < 6;
    }
    
    // Check if the board is full (draw condition)
    checkDraw() {
        for (let col = 0; col < 7; col++) {
            if (this.board[col][0] === null) {
                return false;
            }
        }
        return true;
    }
    
    // Get the next available row in a column
    getNextAvailableRow(columnIndex) {
        for (let row = 5; row >= 0; row--) {
            if (this.board[columnIndex][row] === null) {
                return row;
            }
        }
        return -1; // Column is full
    }
    
    // Make a move on the board
    makeMove(columnIndex, row, player) {
        if (this.isValidCell(columnIndex, row) && this.board[columnIndex][row] === null) {
            this.board[columnIndex][row] = player;
            return true;
        }
        return false;
    }
    
    // Undo a move (for AI calculations)
    undoMove(columnIndex, row) {
        if (this.isValidCell(columnIndex, row)) {
            this.board[columnIndex][row] = null;
        }
    }
    
    // Get all valid moves
    getValidMoves() {
        const validMoves = [];
        for (let col = 0; col < 7; col++) {
            const row = this.getNextAvailableRow(col);
            if (row !== -1) {
                validMoves.push({col, row});
            }
        }
        return validMoves;
    }
    
    // Evaluate board position for AI
    evaluatePosition() {
        let score = 0;
        
        // Check all possible 4-in-a-row positions
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 6; row++) {
                if (this.board[col][row] !== null) {
                    score += this.evaluateCell(col, row);
                }
            }
        }
        
        return score;
    }
    
    // Evaluate a specific cell's contribution to the score
    evaluateCell(columnIndex, row) {
        const player = this.board[columnIndex][row];
        const opponent = player === 'red' ? 'yellow' : 'red';
        let score = 0;
        
        // Check all four directions
        const directions = [
            {deltaCol: 1, deltaRow: 0},  // Horizontal
            {deltaCol: 0, deltaRow: 1},  // Vertical
            {deltaCol: 1, deltaRow: 1},  // Diagonal \
            {deltaCol: 1, deltaRow: -1}  // Diagonal /
        ];
        
        directions.forEach(dir => {
            const lineScore = this.evaluateLine(columnIndex, row, player, opponent, dir.deltaCol, dir.deltaRow);
            score += lineScore;
        });
        
        return score;
    }
    
    // Evaluate a line of 4 positions
    evaluateLine(columnIndex, row, player, opponent, deltaCol, deltaRow) {
        let playerCount = 0;
        let opponentCount = 0;
        let emptyCount = 0;
        
        // Check 4 positions in the line
        for (let i = 0; i < 4; i++) {
            const checkCol = columnIndex + (i * deltaCol);
            const checkRow = row + (i * deltaRow);
            
            if (!this.isValidCell(checkCol, checkRow)) {
                return 0; // Invalid line
            }
            
            const cellValue = this.board[checkCol][checkRow];
            if (cellValue === player) {
                playerCount++;
            } else if (cellValue === opponent) {
                opponentCount++;
            } else {
                emptyCount++;
            }
        }
        
        // Calculate score based on line composition
        if (opponentCount > 0) {
            return 0; // Opponent blocks this line
        }
        
        if (playerCount === 4) {
            return 1000; // Win
        } else if (playerCount === 3 && emptyCount === 1) {
            return 100; // Three in a row with one empty
        } else if (playerCount === 2 && emptyCount === 2) {
            return 10; // Two in a row with two empty
        } else if (playerCount === 1 && emptyCount === 3) {
            return 1; // One in a row with three empty
        }
        
        return 0;
    }
    
    // Get winning cells for highlighting
    getWinningCells() {
        return this.winningCells;
    }
    
    // Reset the board
    resetBoard() {
        this.board = Array(7).fill(null).map(() => Array(6).fill(null));
        this.winningCells = [];
    }
    
    // Copy board state (for AI calculations)
    copyBoard() {
        return this.board.map(column => [...column]);
    }
    
    // Set board state (for AI calculations)
    setBoard(newBoard) {
        this.board = newBoard.map(column => [...column]);
    }
}
