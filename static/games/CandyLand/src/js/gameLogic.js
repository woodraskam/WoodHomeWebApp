// Candyland Adventure - Core Game Logic

// Player selection with visual feedback
function selectPlayers(count) {
    gameState.playerCount = count;
    document.getElementById('start-game-btn').disabled = false;
    
    // Update button styles with bounce effect
    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.style.opacity = '0.6';
        btn.style.transform = 'scale(1)';
    });
    event.target.style.opacity = '1';
    event.target.style.transform = 'scale(1.2)';
    
    // Play selection sound
    playSound('select');
}

// Start game with celebration
function startGame() {
    if (gameState.playerCount === 0) return;
    
    // Initialize players with custom names
    gameState.players = [];
    const playerNames = ['Elva', 'Mark', 'William', 'Danielle'];
    
    for (let i = 0; i < gameState.playerCount; i++) {
        const playerName = playerNames[i] || `Player ${i + 1}`;
        const player = createPlayer(i, playerName, false);
        gameState.players.push(player);
    }
    
    // Add AI player for single player mode
    if (gameState.playerCount === 1) {
        const aiPlayer = createPlayer(1, 'AI Player', true);
        gameState.players.push(aiPlayer);
        gameState.playerCount = 2; // Now we have 2 players (human + AI)
    }
    
    // Hide start screen with fade effect
    const startScreen = document.getElementById('start-screen');
    startScreen.style.transition = 'all 0.5s ease';
    startScreen.style.opacity = '0';
    startScreen.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        const gameBoard = document.getElementById('game-board');
        gameBoard.classList.add('show');
        
        // Animate game board entrance
        gameBoard.style.opacity = '0';
        gameBoard.style.transform = 'scale(0.8)';
        setTimeout(() => {
            gameBoard.style.transition = 'all 0.5s ease';
            gameBoard.style.opacity = '1';
            gameBoard.style.transform = 'scale(1)';
            
            // Create the board AFTER it's visible
            createBoard(); // This will create both timeline and swim lanes
            createPlayerScoreRow(); // Create player score row
            createWheelDeck(); // Create wheel deck
            updatePlayerInfo();
            updateCurrentPlayer();
            placeGamePieces();
        }, 50);
    }, 500);
    
            gameState.gameStarted = true;
            gameState.currentPlayer = 0;
            
            // Update main action button for game state
            updateMainActionButton();

            playSound('start');
}

// Update swim lane active states - show only current player's lane
function updatePlayerInfo() {
    console.log('🔄 Updating player info, current player:', gameState.currentPlayer);
    
    // Update active lane highlighting - show only current player's lane
    gameState.players.forEach((player, index) => {
        const lane = document.getElementById(`lane-${player.id}`);
        if (lane) {
            if (index === gameState.currentPlayer) {
                lane.classList.add('active');
                console.log('🎯 Showing swim lane for', player.name);
            } else {
                lane.classList.remove('active');
                console.log('🫥 Hiding swim lane for', player.name);
            }
        }
    });
    
    // Update player score cards
    if (typeof updatePlayerScoreCards === 'function') {
        updatePlayerScoreCards();
    }
}

// Update current player with animation
function updateCurrentPlayer() {
    // Current player info is now shown in the swim lane header
    // No need to update a separate current player element
    return;
}

// Spin the wheel to get a card
function spinWheelForCard() {
    console.log('🎡 spinWheelForCard called');
    console.log('Game started:', gameState.gameStarted);
    console.log('Card already drawn:', gameState.drawnCard);
    console.log('Animation in progress:', gameState.animationInProgress);
    console.log('Wheel spinning:', gameState.wheelSpinning);
    
    if (!gameState.gameStarted || gameState.drawnCard || gameState.animationInProgress || gameState.wheelSpinning) {
        console.log('❌ Exiting spinWheelForCard early - game not started, card already drawn, animation in progress, or wheel spinning');
        return;
    }
    
    // Check if current player is AI
    const currentPlayer = getCurrentPlayer();
    console.log('Current player:', currentPlayer);
    logGameState('before card draw');
    
    if (currentPlayer.isAI) {
        console.log('🤖 AI player - scheduling wheel spin');
        // AI automatically spins after a short delay
        setTimeout(() => {
            performWheelSpin();
        }, gameConfig.AI_THINKING_TIME || 1000);
        return;
    }
    
    console.log('👤 Human player - spinning wheel immediately');
    performWheelSpin();
}

function performWheelSpin() {
    console.log('🎯 performWheelSpin called');
    
    // Set animation state to prevent new actions
    gameState.animationInProgress = true;
    updateMainActionButton();
    
    // First, determine which card will be drawn
    const availableCards = getAvailableWheelCards();
    if (availableCards.length === 0) {
        // Reset deck if no cards available
        gameState.usedCards = [];
        createWheelDeck();
        return performWheelSpin(); // Recursive call with fresh deck
    }
    
    // Select the card that will be drawn (predetermined)
    const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    console.log('🎯 Predetermined card:', selectedCard);
    
    // Show card overlay with the predetermined card
    showCardOverlay(selectedCard);
    
    // Play card draw sound
    playSound('card');
    console.log('🎵 Playing card sound, showing card overlay');
    
    // Start spinning after a brief delay to show the overlay
    setTimeout(() => {
        const result = startCardSpinning(selectedCard);
        console.log('Card result from spinning:', result);
        
        if (!result) {
            console.error('❌ Failed to spin wheel');
            gameState.animationInProgress = false;
            updateMainActionButton();
            hideWheelOverlay();
            return;
        }
        
        // The wheel spin function will handle setting gameState.drawnCard
        // and updating the UI after the spin animation completes
    }, 100);
}

// Move player with enhanced animation
function movePlayer() {
    console.log('🎯 movePlayer called');
    const player = getCurrentPlayer();
    const card = gameState.drawnCard;
    
    if (!player) {
        console.error('❌ No current player found');
        return;
    }
    if (!card) {
        console.error('❌ No card drawn');
        return;
    }
    
    console.log('🎴 Moving player', player.name, 'with card:', card);
    const targetPosition = calculateTargetPosition(player, card);
    console.log('🎯 Target position calculated:', targetPosition);
    
    // Animate movement with enhanced effects
    animateMovement(player, targetPosition, () => {
        // Check for special squares with celebration
        checkSpecialSquare(targetPosition);
        
        // Check for win condition - player wins when reaching square 133 (the castle)
        if (checkWinCondition(player)) {
            setTimeout(() => showVictory(player), 1000);
            return;
        }
        
        // Check if player should skip turn
        const effects = checkSpecialSquareEffects(targetPosition);
        if (effects.includes('sticky')) {
            player.skipTurn = true;
        }
        
        // Automatically end turn after animation completes
        setTimeout(() => {
            console.log('⏰ Timeout completed, calling endTurnAutomatically for', player.name);
            endTurnAutomatically();
        }, 500); // Small delay to let any special effects play
    });
}

// Check special square effects with celebrations
function checkSpecialSquare(position) {
    const square = document.getElementById(`square-${position}`);
    if (!square) return;
    
    const effects = checkSpecialSquareEffects(position);
    
    if (effects.includes('landmark')) {
        // Enhanced celebration for reaching landmark
        square.style.animation = 'sparkle 2s ease-in-out 3';
        createCelebrationBurst(square);
        playSound('special');
        
        setTimeout(() => {
            square.style.animation = '';
        }, 6000);
    }
}

// Automatically end turn after animation completes
function endTurnAutomatically() {
    const currentPlayer = getCurrentPlayer();
    console.log('🔄 Automatically ending turn for', currentPlayer ? currentPlayer.name : 'unknown player');
    console.log('🔍 Current game state:', {
        currentPlayer: gameState.currentPlayer,
        animationInProgress: gameState.animationInProgress,
        drawnCard: gameState.drawnCard ? gameState.drawnCard.type : 'none'
    });
    
    // Reset card display with animation
    gameState.drawnCard = null;
    const drawnCardEl = document.getElementById('drawn-card');
    const cardTextEl = document.getElementById('card-text');
    
    if (drawnCardEl && cardTextEl) {
        drawnCardEl.style.transform = 'rotateY(90deg) scale(0.8)';
        setTimeout(() => {
            drawnCardEl.innerHTML = '🎴';
            cardTextEl.textContent = 'Draw a magical card!';
            drawnCardEl.style.transform = 'rotateY(0deg) scale(1)';
        }, gameConfig.CARD_FLIP_DURATION / 2);
    }
    
    // Move to next player
    advanceToNextPlayer();
    
    updatePlayerInfo();
    updateCurrentPlayer();
    
    // Clear animation state and update button
    gameState.animationInProgress = false;
    updateMainActionButton();
    
    logGameState('after turn end');
    
    // If next player is AI, automatically draw card
    const nextPlayer = getCurrentPlayer();
    console.log('🤖 Next player:', nextPlayer ? nextPlayer.name : 'unknown', 'isAI:', nextPlayer ? nextPlayer.isAI : 'unknown');
    
    if (nextPlayer && nextPlayer.isAI) {
        console.log('🤖 Scheduling AI turn for', nextPlayer.name);
        setTimeout(() => {
            // Double-check that it's still this player's turn and no animation is in progress
            const currentPlayer = getCurrentPlayer();
            if (currentPlayer && currentPlayer.id === nextPlayer.id && !gameState.animationInProgress) {
                console.log('🤖 Executing AI turn for', currentPlayer.name);
                drawCard();
            } else {
                console.warn('⚠️ AI turn cancelled - player changed or animation in progress');
            }
        }, 1500);
    }
}

// Manual end turn (kept for compatibility, but not used in main flow)
function endTurn() {
    endTurnAutomatically();
}

// Enhanced victory screen with massive celebration
function showVictory(player) {
    const victoryTitle = document.getElementById('victory-title');
    const victoryMessage = document.getElementById('victory-message');
    const victoryScreen = document.getElementById('victory-screen');
    const victoryAvatar = document.getElementById('victory-player-avatar');
    
    if (victoryTitle && victoryMessage && victoryScreen && victoryAvatar) {
        // Update victory text
        victoryTitle.textContent = `🎉 ${player.name} WINS! 🎉`;
        victoryMessage.textContent = `Congratulations! You reached the magical Candy Castle first!`;
        
        // Create and display player avatar
        const avatarElement = document.createElement('div');
        avatarElement.className = 'victory-avatar';
        avatarElement.style.background = player.color;
        
        // Try to load PNG asset, fallback to emoji
        if (player.assetPath) {
            const avatarImg = document.createElement('img');
            avatarImg.src = player.assetPath;
            avatarImg.className = 'victory-avatar-image';
            avatarImg.alt = player.name;
            
            avatarImg.onerror = () => {
                // Fallback to emoji if PNG fails
                avatarElement.innerHTML = player.emoji;
                avatarElement.style.background = player.color;
            };
            
            avatarImg.onload = () => {
                avatarElement.innerHTML = '';
                avatarElement.appendChild(avatarImg);
                avatarElement.style.background = 'transparent';
            };
            
            // Set initial emoji while image loads
            avatarElement.innerHTML = player.emoji;
        } else {
            avatarElement.innerHTML = player.emoji;
        }
        
        // Clear previous avatar and add new one
        victoryAvatar.innerHTML = '';
        victoryAvatar.appendChild(avatarElement);
        
        // Show victory screen
        victoryScreen.style.display = 'flex';
        
        // Create confetti explosion using confetti.js library
        if (typeof ConfettiGenerator !== 'undefined') {
            const confetti = new ConfettiGenerator('confetti-canvas');
            confetti.setCount(75);
            confetti.setSize(1);
            confetti.setPower(25);
            confetti.setFade(false);
            confetti.destroyTarget(true);
            confetti.render();
            
            // Store confetti instance for cleanup
            window.currentConfetti = confetti;
        }
        
        // Play victory sound
        playSound('victory');
        
        console.log('🏆 Victory screen displayed for', player.name, 'with avatar');
    }
}

// New game with reset animation
function newGame() {
    // Clean up any existing confetti
    if (window.currentConfetti) {
        window.currentConfetti.clear();
        window.currentConfetti = null;
    }
    
    // Reset game state
    resetGameState();
    
    // Animate transition back to start screen
    const gameBoard = document.getElementById('game-board');
    const startScreen = document.getElementById('start-screen');
    const victoryScreen = document.getElementById('victory-screen');
    
    if (gameBoard && startScreen && victoryScreen) {
        if (gameBoard.classList.contains('show')) {
            gameBoard.style.transition = 'all 0.5s ease';
            gameBoard.style.opacity = '0';
            gameBoard.style.transform = 'scale(0.8)';
        }
        
        victoryScreen.style.display = 'none';
        
        setTimeout(() => {
            gameBoard.classList.remove('show');
            startScreen.style.display = 'block';
            startScreen.style.opacity = '0';
            startScreen.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                startScreen.style.transition = 'all 0.5s ease';
                startScreen.style.opacity = '1';
                startScreen.style.transform = 'scale(1)';
            }, 50);
        }, 500);
    }
    
    // Reset buttons
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.disabled = true;
    }
    
    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1)';
    });
    
    // Clear confetti
    document.querySelectorAll('.confetti').forEach(confetti => confetti.remove());
    
    // Reinitialize the game
    initializeGame();
}

// Add keyboard shortcuts for accessibility
function initializeKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (!gameState.gameStarted) {
                const startBtn = document.getElementById('start-game-btn');
                if (startBtn && !startBtn.disabled) {
                    startGame();
                }
            } else {
                const currentPlayer = getCurrentPlayer();
                if (currentPlayer && !currentPlayer.isAI && !gameState.animationInProgress) {
                    // Use the main action handler for consistency
                    handleMainAction();
                }
            }
            e.preventDefault();
        }
        
        // ESC key for new game
        if (e.key === 'Escape') {
            newGame();
            e.preventDefault();
        }
    });
}

// Handle main action button (draw card only)
function handleMainAction() {
    console.log('🎮 handleMainAction called');
    console.log('Game started:', gameState.gameStarted);
    console.log('Animation in progress:', gameState.animationInProgress);
    
    if (!gameState.gameStarted) {
        console.log('❌ Game not started');
        return;
    }
    
    if (gameState.animationInProgress) {
        console.log('⏳ Animation in progress, please wait...');
        return;
    }
    
    console.log('🎡 Spinning wheel');
    spinWheelForCard();
}

// Debug function to log current game state
function logGameState(context = '') {
    const currentPlayer = getCurrentPlayer();
    console.log(`🔍 Game State Debug ${context}:`, {
        currentPlayerIndex: gameState.currentPlayer,
        currentPlayerName: currentPlayer ? currentPlayer.name : 'none',
        currentPlayerIsAI: currentPlayer ? currentPlayer.isAI : 'unknown',
        animationInProgress: gameState.animationInProgress,
        drawnCard: gameState.drawnCard ? `${gameState.drawnCard.type} - ${gameState.drawnCard.color || gameState.drawnCard.character}` : 'none',
        gameStarted: gameState.gameStarted,
        playersSkipTurn: gameState.players.map(p => ({ name: p.name, skipTurn: p.skipTurn }))
    });
}

// Update button text based on game state
function updateMainActionButton() {
    const button = document.getElementById('main-action-btn');
    if (!button) return;
    
    if (!gameState.gameStarted) {
        button.textContent = '🎮 Start Game';
        button.disabled = true;
        button.className = 'btn btn-primary';
    } else if (gameState.animationInProgress) {
        button.textContent = '⏳ Animation Playing...';
        button.disabled = true;
        button.className = 'btn btn-secondary';
    } else {
        button.textContent = '🎲 Draw a Card!';
        button.disabled = false;
        button.className = 'btn btn-primary';
    }
}

// Make functions available globally for the game
window.selectPlayers = selectPlayers;
window.startGame = startGame;
window.updatePlayerInfo = updatePlayerInfo;
window.updateCurrentPlayer = updateCurrentPlayer;
window.drawCard = drawCard;
window.performCardDraw = performCardDraw;
window.movePlayer = movePlayer;
window.checkSpecialSquare = checkSpecialSquare;
window.endTurn = endTurn;
window.endTurnAutomatically = endTurnAutomatically;
window.showVictory = showVictory;
window.newGame = newGame;
window.initializeKeyboardControls = initializeKeyboardControls;
window.handleMainAction = handleMainAction;
window.updateMainActionButton = updateMainActionButton;
window.logGameState = logGameState;

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectPlayers,
        startGame,
        updatePlayerInfo,
        updateCurrentPlayer,
        drawCard,
        performCardDraw,
        movePlayer,
        checkSpecialSquare,
        endTurn,
        showVictory,
        newGame,
        initializeKeyboardControls
    };
}
