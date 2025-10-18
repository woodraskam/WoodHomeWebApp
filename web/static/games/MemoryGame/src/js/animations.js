// Memory Game - Animation Manager

class MemoryGameAnimations {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    flipCard(cardElement) {
        if (!cardElement) return;
        
        cardElement.classList.add('flipping');
        
        setTimeout(() => {
            cardElement.classList.remove('flipping');
            cardElement.classList.add('flipped');
        }, 300);
    }

    flipCardsBack() {
        const flippedCards = document.querySelectorAll('.memory-card.flipped:not(.matched)');
        
        flippedCards.forEach(card => {
            card.classList.add('flipping');
            
            setTimeout(() => {
                card.classList.remove('flipping', 'flipped');
            }, 300);
        });
    }

    showMatch() {
        const flippedCards = document.querySelectorAll('.memory-card.flipped:not(.matched)');
        
        flippedCards.forEach(card => {
            card.classList.add('matching', 'matched');
            
            setTimeout(() => {
                card.classList.remove('matching');
            }, 500);
        });
    }

    showMismatch() {
        const flippedCards = document.querySelectorAll('.memory-card.flipped:not(.matched)');
        
        flippedCards.forEach(card => {
            card.classList.add('mismatching');
            
            setTimeout(() => {
                card.classList.remove('mismatching');
            }, 500);
        });
    }

    shuffleCards() {
        const cards = document.querySelectorAll('.memory-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('shuffling');
                
                setTimeout(() => {
                    card.classList.remove('shuffling');
                }, 800);
            }, index * 50);
        });
    }

    updatePlayerIndicator() {
        const playerIndicator = document.querySelector('.player-indicator');
        if (playerIndicator) {
            playerIndicator.classList.add('active');
            
            setTimeout(() => {
                playerIndicator.classList.remove('active');
            }, 2000);
        }
    }

    updateScore(scoreElement) {
        if (scoreElement) {
            scoreElement.classList.add('updating');
            
            setTimeout(() => {
                scoreElement.classList.remove('updating');
            }, 500);
        }
    }

    shakeBoard() {
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.classList.add('shaking');
            
            setTimeout(() => {
                gameBoard.classList.remove('shaking');
            }, 500);
        }
    }

    showVictoryCelebration() {
        const victoryContent = document.querySelector('.victory-content');
        if (victoryContent) {
            victoryContent.classList.add('celebrating');
            
            setTimeout(() => {
                victoryContent.classList.remove('celebrating');
            }, 1000);
        }
    }

    revealCard(cardElement) {
        if (cardElement) {
            cardElement.classList.add('revealing');
            
            setTimeout(() => {
                cardElement.classList.remove('revealing');
            }, 300);
        }
    }

    resizeGrid() {
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.classList.add('resizing');
            
            setTimeout(() => {
                gameBoard.classList.remove('resizing');
            }, 500);
        }
    }

    switchPlayer() {
        const currentPlayer = document.querySelector('.current-player');
        if (currentPlayer) {
            currentPlayer.classList.add('switching');
            
            setTimeout(() => {
                currentPlayer.classList.remove('switching');
            }, 500);
        }
    }

    updateStatus() {
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.classList.add('updating');
            
            setTimeout(() => {
                statusMessage.classList.remove('updating');
            }, 300);
        }
    }

    showLoading() {
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-spinner';
            loadingDiv.id = 'loading-spinner';
            gameBoard.appendChild(loadingDiv);
        }
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.remove();
        }
    }

    flashSuccess(cardElement) {
        if (cardElement) {
            cardElement.classList.add('success-flash');
            
            setTimeout(() => {
                cardElement.classList.remove('success-flash');
            }, 500);
        }
    }

    flashError(cardElement) {
        if (cardElement) {
            cardElement.classList.add('error-flash');
            
            setTimeout(() => {
                cardElement.classList.remove('error-flash');
            }, 500);
        }
    }

    disableCard(cardElement) {
        if (cardElement) {
            cardElement.classList.add('disabled');
        }
    }

    enableCard(cardElement) {
        if (cardElement) {
            cardElement.classList.remove('disabled');
        }
    }

    disableAllCards() {
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => {
            this.disableCard(card);
        });
    }

    enableAllCards() {
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => {
            this.enableCard(card);
        });
    }

    // Queue system for complex animations
    addToQueue(animationFunction, delay = 0) {
        this.animationQueue.push({ func: animationFunction, delay });
        this.processQueue();
    }

    processQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) {
            return;
        }
        
        this.isAnimating = true;
        const animation = this.animationQueue.shift();
        
        setTimeout(() => {
            animation.func();
            this.isAnimating = false;
            this.processQueue();
        }, animation.delay);
    }

    clearQueue() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    // Complex animation sequences
    playMatchSequence(card1, card2) {
        this.clearQueue();
        
        this.addToQueue(() => this.flipCard(card1), 0);
        this.addToQueue(() => this.flipCard(card2), 300);
        this.addToQueue(() => this.showMatch(), 600);
        this.addToQueue(() => this.flashSuccess(card1), 1100);
        this.addToQueue(() => this.flashSuccess(card2), 1100);
    }

    playMismatchSequence(card1, card2) {
        this.clearQueue();
        
        this.addToQueue(() => this.flipCard(card1), 0);
        this.addToQueue(() => this.flipCard(card2), 300);
        this.addToQueue(() => this.showMismatch(), 600);
        this.addToQueue(() => this.flashError(card1), 1100);
        this.addToQueue(() => this.flashError(card2), 1100);
        this.addToQueue(() => this.flipCardsBack(), 1600);
    }

    playNewGameSequence() {
        this.clearQueue();
        
        this.addToQueue(() => this.showLoading(), 0);
        this.addToQueue(() => this.hideLoading(), 500);
        this.addToQueue(() => this.shuffleCards(), 600);
    }

    playVictorySequence() {
        this.clearQueue();
        
        this.addToQueue(() => this.showVictoryCelebration(), 0);
        this.addToQueue(() => this.shakeBoard(), 1000);
    }
}
