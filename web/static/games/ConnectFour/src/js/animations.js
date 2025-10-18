// Connect Four - Animation Manager

class ConnectFourAnimations {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
    }
    
    // Animate disc drop
    animateDiscDrop(columnIndex, row, player, callback) {
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (!cell) return;
        
        // Create floating disc
        const floatingDisc = this.createFloatingDisc(player);
        const cellRect = cell.getBoundingClientRect();
        const boardRect = document.getElementById('gameBoard').getBoundingClientRect();
        
        // Position floating disc above the board
        floatingDisc.style.left = cellRect.left - boardRect.left + 'px';
        floatingDisc.style.top = '-100px';
        
        // Add to board
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.appendChild(floatingDisc);
        
        // Animate drop
        requestAnimationFrame(() => {
            floatingDisc.style.transition = 'top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            floatingDisc.style.top = cellRect.top - boardRect.top + 'px';
        });
        
        // Clean up and update cell
        setTimeout(() => {
            cell.classList.add('occupied', player);
            cell.classList.add('disc-dropping');
            gameBoard.removeChild(floatingDisc);
            
            setTimeout(() => {
                cell.classList.remove('disc-dropping');
                if (callback) callback();
            }, 100);
        }, 600);
    }
    
    // Create floating disc element
    createFloatingDisc(player) {
        const disc = document.createElement('div');
        disc.className = `floating-disc ${player}`;
        disc.style.cssText = `
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${player === 'red' ? '#F44336' : '#FFEB3B'};
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            pointer-events: none;
        `;
        return disc;
    }
    
    // Animate winning line
    animateWinningLine(winningCells) {
        winningCells.forEach((cell, index) => {
            const cellElement = document.querySelector(`[data-column="${cell.col}"][data-row="${cell.row}"]`);
            if (cellElement) {
                setTimeout(() => {
                    cellElement.classList.add('winning', 'win-line');
                }, index * 200);
            }
        });
    }
    
    // Animate board shake
    animateBoardShake() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.classList.add('board-shake');
        setTimeout(() => {
            gameBoard.classList.remove('board-shake');
        }, 500);
    }
    
    // Animate game over celebration
    animateGameOver(winner) {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.classList.add('game-over');
        
        // Create confetti effect
        this.createConfetti(winner);
        
        setTimeout(() => {
            gameBoard.classList.remove('game-over');
        }, 2000);
    }
    
    // Create confetti effect
    createConfetti(winner) {
        const colors = winner === 'red' ? ['#F44336', '#FF5722', '#E91E63'] : ['#FFEB3B', '#FFC107', '#FF9800'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    z-index: 2000;
                    pointer-events: none;
                    animation: confettiFall 3s linear forwards;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
    }
    
    // Animate column hover preview
    animateColumnPreview(columnIndex, player, show) {
        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (!column) return;
        
        if (show) {
            column.classList.add('column-hover');
            this.showDiscPreview(columnIndex, player);
        } else {
            column.classList.remove('column-hover');
            this.hideDiscPreview();
        }
    }
    
    // Show disc preview
    showDiscPreview(columnIndex, player) {
        const row = this.getNextAvailableRow(columnIndex);
        if (row === -1) return;
        
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('disc-preview', player);
        }
    }
    
    // Hide disc preview
    hideDiscPreview() {
        const previewCells = document.querySelectorAll('.disc-preview');
        previewCells.forEach(cell => {
            cell.classList.remove('disc-preview', 'red', 'yellow');
        });
    }
    
    // Get next available row (helper method)
    getNextAvailableRow(columnIndex) {
        for (let row = 5; row >= 0; row--) {
            const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
            if (cell && !cell.classList.contains('occupied')) {
                return row;
            }
        }
        return -1;
    }
    
    // Animate status message update
    animateStatusUpdate(message) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.classList.add('status-update');
            statusElement.querySelector('.status-message').textContent = message;
            
            setTimeout(() => {
                statusElement.classList.remove('status-update');
            }, 500);
        }
    }
    
    // Animate button press
    animateButtonPress(button) {
        button.classList.add('pulse');
        setTimeout(() => {
            button.classList.remove('pulse');
        }, 200);
    }
    
    // Animate cell highlight
    animateCellHighlight(columnIndex, row, duration = 1000) {
        const cell = document.querySelector(`[data-column="${columnIndex}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('glow');
            setTimeout(() => {
                cell.classList.remove('glow');
            }, duration);
        }
    }
    
    // Animate board reset
    animateBoardReset() {
        const cells = document.querySelectorAll('.board-cell');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('fade-in');
                cell.classList.remove('occupied', 'red', 'yellow', 'winning', 'win-line');
            }, index * 50);
        });
    }
    
    // Animate settings change
    animateSettingsChange() {
        const settings = document.querySelector('.game-settings');
        if (settings) {
            settings.classList.add('slide-in');
            setTimeout(() => {
                settings.classList.remove('slide-in');
            }, 500);
        }
    }
}

// Add confetti fall animation to CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle);
