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
        console.log('Setting up event listeners for', columns.length, 'columns');
        columns.forEach((column, index) => {
            console.log('Adding click listener to column', index);
            column.addEventListener('click', () => {
                console.log('Column clicked:', index);
                this.handleColumnClick(index);
            });
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

        // Victory screen buttons
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('go-home-btn').addEventListener('click', () => this.goHome());
    }

    handleColumnClick(columnIndex) {
        console.log('handleColumnClick called with column:', columnIndex);
        console.log('Game active:', this.gameActive);

        if (!this.gameActive) {
            console.log('Game not active, returning');
            return;
        }

        const row = this.getNextAvailableRow(columnIndex);
        console.log('Next available row:', row);
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

        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (column) {
            const cell = column.querySelector(`[data-row="${row}"]`);
            if (cell) {
                cell.classList.add('disc-preview', this.currentPlayer);
            }
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
        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (column) {
            const cell = column.querySelector(`[data-row="${row}"]`);
            if (cell) {
                console.log('Before update - Cell classes:', cell.className);
                console.log('Adding classes to cell:', 'occupied', player);
                // Remove any preview classes first
                cell.classList.remove('disc-preview', 'red', 'yellow');
                console.log('After removing preview classes:', cell.className);
                // Add the occupied and player color classes
                cell.classList.add('occupied', player);
                console.log('Final cell classes:', cell.className);
                console.log('Cell has red class:', cell.classList.contains('red'));
                console.log('Cell has occupied class:', cell.classList.contains('occupied'));
            }
        }
    }

    animateDiscDrop(columnIndex, row) {
        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (column) {
            const cell = column.querySelector(`[data-row="${row}"]`);
            if (cell) {
                cell.classList.add('disc-dropping');
                setTimeout(() => {
                    cell.classList.remove('disc-dropping');
                }, 600);
            }
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
            this.showVictoryScreen(this.currentPlayer);
        } else if (result === 'draw') {
            this.updateGameStatus('It\'s a draw! 🤝');
            this.showVictoryScreen(null);
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

    checkWin(columnIndex, row) {
        const player = this.currentPlayer;

        // Check horizontal
        let count = 1;
        // Check left
        for (let col = columnIndex - 1; col >= 0 && this.board[col][row] === player; col--) {
            count++;
        }
        // Check right
        for (let col = columnIndex + 1; col < 7 && this.board[col][row] === player; col++) {
            count++;
        }
        if (count >= 4) return true;

        // Check vertical
        count = 1;
        // Check down
        for (let r = row - 1; r >= 0 && this.board[columnIndex][r] === player; r--) {
            count++;
        }
        // Check up
        for (let r = row + 1; r < 6 && this.board[columnIndex][r] === player; r++) {
            count++;
        }
        if (count >= 4) return true;

        // Check diagonal (top-left to bottom-right)
        count = 1;
        // Check top-left
        for (let col = columnIndex - 1, r = row - 1; col >= 0 && r >= 0 && this.board[col][r] === player; col--, r--) {
            count++;
        }
        // Check bottom-right
        for (let col = columnIndex + 1, r = row + 1; col < 7 && r < 6 && this.board[col][r] === player; col++, r++) {
            count++;
        }
        if (count >= 4) return true;

        // Check diagonal (top-right to bottom-left)
        count = 1;
        // Check top-right
        for (let col = columnIndex + 1, r = row - 1; col < 7 && r >= 0 && this.board[col][r] === player; col++, r--) {
            count++;
        }
        // Check bottom-left
        for (let col = columnIndex - 1, r = row + 1; col >= 0 && r < 6 && this.board[col][r] === player; col--, r++) {
            count++;
        }
        if (count >= 4) return true;

        return false;
    }

    checkDraw() {
        return this.moveCount >= 42; // 7 columns * 6 rows = 42 total moves
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

    showVictoryScreen(winner) {
        const victoryScreen = document.getElementById('victory-screen');
        const victoryTitle = document.getElementById('victory-title');
        const victoryMessage = document.getElementById('victory-message');
        const victoryIcon = document.getElementById('victory-icon');

        if (!victoryScreen || !victoryTitle || !victoryMessage || !victoryIcon) {
            console.error('Victory screen elements not found');
            return;
        }

        if (winner) {
            // Clear existing content and add colored disc
            victoryIcon.innerHTML = '';
            const disc = document.createElement('div');
            disc.style.width = '60px';
            disc.style.height = '60px';
            disc.style.borderRadius = '50%';
            disc.style.margin = '0 auto';
            disc.style.border = '4px solid white';
            disc.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';

            if (winner === 'red') {
                disc.style.background = 'var(--primary-red)';
                victoryTitle.textContent = 'Red Player Wins!';
                victoryMessage.textContent = 'Congratulations! Red player has won the game!';
            } else {
                disc.style.background = 'var(--primary-yellow)';
                victoryTitle.textContent = 'Yellow Player Wins!';
                victoryMessage.textContent = 'Congratulations! Yellow player has won the game!';
            }

            victoryIcon.appendChild(disc);
        } else {
            victoryIcon.innerHTML = '🤝';
            victoryTitle.textContent = 'DRAW!';
            victoryMessage.textContent = 'It\'s a tie! Great game!';
        }

        // Show victory screen
        victoryScreen.classList.add('show');
        console.log(`Victory screen shown: ${winner || 'Draw'}`);
    }

    hideVictoryScreen() {
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.classList.remove('show');
        }
    }

    playAgain() {
        console.log('Playing again...');
        this.hideVictoryScreen();
        this.resetGame();
    }

    goHome() {
        console.log('Going home...');
        window.location.href = '/';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectFourGame();

    // Make game instance globally accessible for debugging
    window.connectFourGame = game;
});
