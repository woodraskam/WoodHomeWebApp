// Connect Four - Main Game Logic

class ConnectFourGame {
    constructor() {
        this.board = Array(7).fill(null).map(() => Array(6).fill(null));
        this.currentPlayer = 'red';
        this.gameMode = 'human'; // 'human' or 'ai'
        this.aiDifficulty = 'medium';
        this.gameActive = true;
        this.moveCount = 0;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus('Click a column to drop your disc!');
        this.resetBoard();
    }
    
    setupEventListeners() {
        // Column click handlers
        const columns = document.querySelectorAll('.board-column');
        columns.forEach((column, index) => {
            column.addEventListener('click', () => this.handleColumnClick(index));
            column.addEventListener('mouseenter', () => this.handleColumnHover(index, true));
            column.addEventListener('mouseleave', () => this.handleColumnHover(index, false));
        });
        
        // Control buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // Settings
        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.updateGameStatus('Game mode changed. Click a column to start!');
        });
        
        document.getElementById('aiDifficulty').addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
            this.updateGameStatus('AI difficulty changed. Click a column to start!');
        });
    }
    
    handleColumnClick(columnIndex) {
        if (!this.gameActive) return;
        
        const row = this.getNextAvailableRow(columnIndex);
        if (row === -1) {
            this.updateGameStatus('Column is full! Choose another column.');
            this.shakeBoard();
            return;
        }
        
        this.makeMove(columnIndex, row);
    }
    
    handleColumnHover(columnIndex, isHovering) {
        if (!this.gameActive) return;
        
        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (isHovering) {
            column.classList.add('column-hover');
            this.showDiscPreview(columnIndex);
        } else {
            column.classList.remove('column-hover');
            this.hideDiscPreview();
        }
    }
    
    showDiscPreview(columnIndex) {
        const row = this.getNextAvailableRow(columnIndex);
        if (row === -1) return;
        
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('disc-preview', this.currentPlayer);
        }
    }
    
    hideDiscPreview() {
        const previewCells = document.querySelectorAll('.disc-preview');
        previewCells.forEach(cell => {
            cell.classList.remove('disc-preview', 'red', 'yellow');
        });
    }
    
    makeMove(columnIndex, row) {
        // Update board state
        this.board[columnIndex][row] = this.currentPlayer;
        this.moveCount++;
        
        // Update UI
        this.updateCell(columnIndex, row, this.currentPlayer);
        this.animateDiscDrop(columnIndex, row);
        
        // Check for win or draw
        if (this.checkWin(columnIndex, row)) {
            this.handleGameEnd('win');
            return;
        }
        
        if (this.checkDraw()) {
            this.handleGameEnd('draw');
            return;
        }
        
        // Switch players
        this.switchPlayer();
        
        // AI move if applicable
        if (this.gameMode === 'ai' && this.currentPlayer === 'yellow') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }
    
    updateCell(columnIndex, row, player) {
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('occupied', player);
        }
    }
    
    animateDiscDrop(columnIndex, row) {
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('disc-dropping');
            setTimeout(() => {
                cell.classList.remove('disc-dropping');
            }, 600);
        }
    }
    
    getNextAvailableRow(columnIndex) {
        for (let row = 5; row >= 0; row--) {
            if (this.board[columnIndex][row] === null) {
                return row;
            }
        }
        return -1; // Column is full
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus(`${this.currentPlayer === 'red' ? 'Red' : 'Yellow'} player's turn`);
    }
    
    updateCurrentPlayerDisplay() {
        const playerDisc = document.querySelector('.player-disc');
        const playerName = document.querySelector('.player-name');
        
        if (playerDisc && playerName) {
            playerDisc.className = `player-disc ${this.currentPlayer}`;
            playerName.textContent = this.currentPlayer === 'red' ? 'Player 1' : 'Player 2';
        }
    }
    
    updateGameStatus(message) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.querySelector('.status-message').textContent = message;
            statusElement.classList.add('status-update');
            setTimeout(() => {
                statusElement.classList.remove('status-update');
            }, 500);
        }
    }
    
    shakeBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.classList.add('board-shake');
        setTimeout(() => {
            gameBoard.classList.remove('board-shake');
        }, 500);
    }
    
    newGame() {
        this.resetGame();
        this.updateGameStatus('New game started! Click a column to drop your disc!');
    }
    
    resetGame() {
        this.board = Array(7).fill(null).map(() => Array(6).fill(null));
        this.currentPlayer = 'red';
        this.gameActive = true;
        this.moveCount = 0;
        
        this.resetBoard();
        this.updateCurrentPlayerDisplay();
        this.updateGameStatus('Game reset! Click a column to drop your disc!');
    }
    
    resetBoard() {
        const cells = document.querySelectorAll('.board-cell');
        cells.forEach(cell => {
            cell.classList.remove('occupied', 'red', 'yellow', 'winning', 'disc-preview');
        });
    }
    
    handleGameEnd(result) {
        this.gameActive = false;
        
        if (result === 'win') {
            const winner = this.currentPlayer === 'red' ? 'Red' : 'Yellow';
            this.updateGameStatus(`${winner} player wins! 🎉`);
            this.highlightWinningCells();
            this.celebrateWin();
        } else if (result === 'draw') {
            this.updateGameStatus('It\'s a draw! 🤝');
        }
    }
    
    celebrateWin() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.classList.add('game-over');
        setTimeout(() => {
            gameBoard.classList.remove('game-over');
        }, 1000);
    }
    
    highlightWinningCells() {
        // This will be implemented in the win detection logic
        // For now, just add a winning class to the current player's cells
        const currentPlayerCells = document.querySelectorAll(`.board-cell.${this.currentPlayer}`);
        currentPlayerCells.forEach(cell => {
            cell.classList.add('winning');
        });
    }
    
    makeAIMove() {
        if (!this.gameActive) return;
        
        // Simple AI: choose a random available column
        const availableColumns = [];
        for (let col = 0; col < 7; col++) {
            if (this.getNextAvailableRow(col) !== -1) {
                availableColumns.push(col);
            }
        }
        
        if (availableColumns.length > 0) {
            const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)];
            const row = this.getNextAvailableRow(randomColumn);
            this.makeMove(randomColumn, row);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectFourGame();
    
    // Make game instance globally accessible for debugging
    window.connectFourGame = game;
});
