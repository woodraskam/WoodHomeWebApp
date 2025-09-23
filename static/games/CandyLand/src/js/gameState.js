// Candyland Adventure - Game State Management

// Global game state
let gameState = {
    players: [],
    currentPlayer: 0,
    deck: [],
    drawnCard: null,
    gameStarted: false,
    playerCount: 0,
    board: [],
    animationInProgress: false,
    specialSquares: {
        sticky: [15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125],
        shortcuts: {
            20: 40,  // Rainbow trail
            50: 70,  // Gumdrop mountain
            80: 100, // Peppermint forest
            110: 130 // Candy castle shortcut
        },
        landmarks: {
            30: '🍭 Peppermint Forest',
            60: '🏔️ Gumdrop Mountain',
            90: '🌲 Licorice Forest',
            120: '🏰 Candy Castle'
        }
    }
};

// Player colors and emojis
const playerColors = ['#FF1493', '#00BFFF', '#32CD32', '#FF6347'];
const playerEmojis = ['😊', '😄', '🤗', '😃'];

// Card types with vibrant colors
const cardTypes = {
    single: ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
    double: ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
    special: ['Princess Lolly', 'Queen Frostine', 'King Candy', 'Gingerbread Man']
};

// Game configuration
const gameConfig = {
    TOTAL_SQUARES: 134,
    SQUARES_PER_ROW: 10,
    MOVEMENT_DELAY: 150, // milliseconds between squares
    AI_THINKING_TIME: 1000, // AI delay for realism
    CARD_FLIP_DURATION: 500,
    VICTORY_CELEBRATION_DURATION: 3000,
    WHEEL_SPIN_DURATION: 3000 // milliseconds for wheel spin animation
};

// Initialize game state
function initializeGame() {
    resetGameState();
    createBoard();
    createDeck();
    shuffleDeck();
}

// Reset game state to initial values
function resetGameState() {
    gameState.players = [];
    gameState.currentPlayer = 0;
    gameState.deck = [];
    gameState.drawnCard = null;
    gameState.gameStarted = false;
    gameState.playerCount = 0;
    gameState.board = Array(gameConfig.TOTAL_SQUARES).fill(null);
    gameState.wheelDeck = [];
    gameState.usedCards = [];
    gameState.wheelSpinning = false;
}

// Create and shuffle deck
function createDeck() {
    gameState.deck = [];

    // Add single color cards (2 of each color)
    cardTypes.single.forEach(color => {
        gameState.deck.push({ type: 'single', color: color, value: 1 });
        gameState.deck.push({ type: 'single', color: color, value: 1 });
    });

    // Add double color cards (2 of each color)
    cardTypes.double.forEach(color => {
        gameState.deck.push({ type: 'double', color: color, value: 2 });
        gameState.deck.push({ type: 'double', color: color, value: 2 });
    });

    // Add special character cards
    cardTypes.special.forEach(character => {
        gameState.deck.push({ type: 'special', character: character, value: 0 });
    });
}

function shuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// Create wheel deck with all possible card options
function createWheelDeck() {
    gameState.wheelDeck = [];

    // Add single color cards (6 colors)
    cardTypes.single.forEach(color => {
        gameState.wheelDeck.push({ type: 'single', color: color, value: 1 });
    });

    // Add double color cards (6 colors)
    cardTypes.double.forEach(color => {
        gameState.wheelDeck.push({ type: 'double', color: color, value: 2 });
    });

    // Add special character cards (4 characters)
    cardTypes.special.forEach(character => {
        gameState.wheelDeck.push({ type: 'special', character: character, value: 0 });
    });

    // Shuffle the wheel deck
    shuffleWheelDeck();
}

function shuffleWheelDeck() {
    for (let i = gameState.wheelDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.wheelDeck[i], gameState.wheelDeck[j]] = [gameState.wheelDeck[j], gameState.wheelDeck[i]];
    }
}

// Get available cards for wheel (not yet used)
function getAvailableWheelCards() {
    return gameState.wheelDeck.filter(card => !gameState.usedCards.includes(card));
}

// Mark a card as used
function markCardAsUsed(card) {
    gameState.usedCards.push(card);

    // If all cards have been used, reset the used cards and reshuffle
    if (gameState.usedCards.length >= gameState.wheelDeck.length) {
        gameState.usedCards = [];
        shuffleWheelDeck();
    }
}

// Player management
function createPlayer(id, name, isAI = false) {
    return {
        id: id,
        name: name,
        position: 0,
        color: playerColors[id],
        emoji: playerEmojis[id],
        skipTurn: false,
        isAI: isAI,
        assetPath: `/static/games/CandyLand/assets/images/players/player${id + 1}.png`
    };
}

function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayer];
}

function getNextPlayer() {
    return gameState.players[(gameState.currentPlayer + 1) % gameState.players.length];
}

function advanceToNextPlayer() {
    const originalPlayer = gameState.currentPlayer;
    console.log('🔄 Advancing from player', gameState.players[originalPlayer].name);

    // Clear the current player's skip turn flag first
    if (gameState.players[gameState.currentPlayer].skipTurn) {
        console.log('🚫 Clearing skip turn for', gameState.players[gameState.currentPlayer].name);
        gameState.players[gameState.currentPlayer].skipTurn = false;
    }

    let attempts = 0;
    const maxAttempts = gameState.players.length + 1; // Prevent infinite loops

    do {
        gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        attempts++;

        console.log('🎯 Trying player', gameState.players[gameState.currentPlayer].name,
            'skipTurn:', gameState.players[gameState.currentPlayer].skipTurn,
            'attempt:', attempts);

        // Safety check to prevent infinite loops
        if (attempts >= maxAttempts) {
            console.warn('⚠️ Max attempts reached in advanceToNextPlayer, breaking loop');
            // Clear all skip turn flags as a safety measure
            gameState.players.forEach(p => p.skipTurn = false);
            break;
        }

    } while (gameState.players[gameState.currentPlayer].skipTurn);

    console.log('✅ Advanced to player', gameState.players[gameState.currentPlayer].name);
}

// Card management
function drawCardFromDeck() {
    // Check if deck is empty, reshuffle if needed
    if (gameState.deck.length === 0) {
        createDeck();
        shuffleDeck();
    }

    return gameState.deck.pop();
}

function getCardEmoji(card) {
    if (card.type === 'special') {
        // Try to load PNG asset, fallback to emoji
        const characterMap = {
            'Princess Lolly': 'princess-lolly',
            'Queen Frostine': 'queen-frostline',
            'King Candy': 'king-candy',
            'Gingerbread Man': 'gingerbread-man'
        };

        const assetName = characterMap[card.character];
        if (assetName) {
            return `<img src="/static/games/CandyLand/assets/images/cards/${assetName}.png" alt="${card.character}" class="card-asset" onerror="this.style.display='none'; this.nextSibling.style.display='inline';" /><span style="display:none;">👑</span>`;
        }
        return '👑';
    }

    const colorEmojis = {
        red: '🔴',
        blue: '🔵',
        yellow: '🟡',
        green: '🟢',
        orange: '🟠',
        purple: '🟣'
    };

    return colorEmojis[card.color];
}

function getCardText(card) {
    if (card.type === 'special') {
        return card.character;
    }

    return `${card.color.toUpperCase()} ${card.value === 2 ? 'DOUBLE' : 'SINGLE'}`;
}

// Movement calculation
function calculateTargetPosition(player, card) {
    console.log('🎯 calculateTargetPosition called with:', {
        player: player.name,
        position: player.position,
        card: card
    });

    let targetPosition = player.position;

    if (card.type === 'special') {
        console.log('⭐ Processing special card:', card.character);
        // Special character cards move to specific locations
        const specialPositions = {
            'Princess Lolly': 30,
            'Queen Frostine': 60,
            'King Candy': 90,
            'Gingerbread Man': 120
        };
        targetPosition = specialPositions[card.character];
    } else {
        console.log('🎨 Processing color card:', card.color, 'value:', card.value);
        // Color cards - find next matching color square using the color pattern
        let steps = card.value;
        const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

        console.log('🎨 Looking for', steps, 'steps of color:', card.color);
        console.log('🔍 Color array being used:', colors);
        console.log('🎯 Starting from position:', player.position);

        for (let i = player.position + 1; i < gameConfig.TOTAL_SQUARES && steps > 0; i++) {
            // Calculate what color this position should be based on the pattern
            const positionColor = colors[i % colors.length];

            // Extra debugging for yellow cards
            if (card.color === 'yellow') {
                console.log('🟡 YELLOW CARD DEBUG - Position', i, ':',
                    'i % colors.length =', i % colors.length,
                    'colors[' + (i % colors.length) + '] =', positionColor,
                    'looking for:', card.color);
            } else {
                console.log('🔍 Position', i, 'color:', positionColor, 'looking for:', card.color);
            }

            if (positionColor === card.color) {
                steps--;
                console.log('✅ Found matching color at position', i, 'steps remaining:', steps);
                if (steps === 0) {
                    targetPosition = i;
                    break;
                }
            }
        }

        // If we can't find enough matching squares, check if we can win
        if (steps > 0 && targetPosition === player.position) {
            console.log('⚠️ Could not complete all steps, checking win condition');

            // Find the last matching color square we can reach
            let furthestMatch = player.position;
            for (let i = player.position + 1; i < gameConfig.TOTAL_SQUARES; i++) {
                const positionColor = colors[i % colors.length];
                if (positionColor === card.color) {
                    furthestMatch = i;
                    console.log('🎯 Found matching color at position', i);
                }
            }

            // If we found at least one matching color, move to it
            if (furthestMatch > player.position) {
                targetPosition = furthestMatch;
                console.log('✅ Moving to furthest matching color at position', targetPosition);

                // SPECIAL CASE: If this is a double card and we're close to the castle,
                // check if we can win by going to the castle instead
                if (card.count > 1 && targetPosition >= gameConfig.TOTAL_SQUARES - 6) {
                    console.log('🎯 Double card near castle - checking if we can win!');
                    // If we're within 6 squares of the castle, we can win
                    targetPosition = gameConfig.TOTAL_SQUARES - 1; // Go to castle
                    console.log('🏰 Double card wins by going to castle at position', targetPosition);
                }
            } else {
                // No matching colors found - this shouldn't happen, but if it does,
                // check if we're close enough to the castle to win
                if (player.position >= gameConfig.TOTAL_SQUARES - 6) {
                    targetPosition = gameConfig.TOTAL_SQUARES - 1; // Go to castle
                    console.log('🏰 No matching colors found, but close to castle - going to castle!');
                }
            }
        }
    }

    // Check for shortcuts
    if (gameState.specialSquares.shortcuts[targetPosition]) {
        targetPosition = gameState.specialSquares.shortcuts[targetPosition];
    }

    // Special rule: If player is within 5 squares of the castle and draws any card,
    // they can reach the castle (makes the game more fun for 3-year-olds)
    if (player.position >= gameConfig.TOTAL_SQUARES - 6 && targetPosition === player.position) {
        targetPosition = gameConfig.TOTAL_SQUARES - 1; // Go to castle
    }

    const finalPosition = Math.min(targetPosition, gameConfig.TOTAL_SQUARES - 1);

    // Verify the final position color matches what we expect
    if (card.type !== 'special') {
        const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
        const finalColor = colors[finalPosition % colors.length];
        console.log('🏁 Final target position:', finalPosition, '(from', player.position, 'to', finalPosition, ')');
        console.log('🎨 Expected color:', card.color, '| Actual color at position', finalPosition + ':', finalColor);

        if (finalColor !== card.color) {
            console.error('❌ COLOR MISMATCH! Expected', card.color, 'but position', finalPosition, 'is', finalColor);
            console.log('🔍 Debugging info:');
            console.log('   Position % 6 =', finalPosition % 6);
            console.log('   colors[' + (finalPosition % 6) + '] =', colors[finalPosition % 6]);
        } else {
            console.log('✅ Color match confirmed:', finalColor);
        }
    }

    return finalPosition;
}

// Special square effects
function checkSpecialSquareEffects(position) {
    const effects = [];

    if (gameState.specialSquares.sticky.includes(position)) {
        effects.push('sticky');
    }

    if (gameState.specialSquares.landmarks[position]) {
        effects.push('landmark');
    }

    if (gameState.specialSquares.shortcuts[position]) {
        effects.push('shortcut');
    }

    return effects;
}

// Win condition
function checkWinCondition(player) {
    return player.position >= gameConfig.TOTAL_SQUARES - 1; // Square 133 is the castle
}

// Debug function to verify color at specific position
function getColorAtPosition(position) {
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
    return colors[position % colors.length];
}

// Debug function to find all positions of a specific color
function findAllColorPositions(color, startPos = 0, endPos = 133) {
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
    const positions = [];
    for (let i = startPos; i <= endPos; i++) {
        if (colors[i % colors.length] === color) {
            positions.push(i);
        }
    }
    return positions;
}

// Debug function to test yellow card movement
function testYellowMovement(fromPosition) {
    console.log('🧪 Testing yellow movement from position', fromPosition);
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

    // Show color pattern around the starting position
    console.log('🎨 Color pattern around position', fromPosition, ':');
    for (let i = Math.max(0, fromPosition - 3); i <= Math.min(133, fromPosition + 10); i++) {
        const color = colors[i % colors.length];
        const marker = i === fromPosition ? ' ← START' : '';
        console.log(`Position ${i}: ${color} (${i} % 6 = ${i % 6})${marker}`);
    }

    // Find next yellow positions
    console.log('🟡 Next yellow positions from', fromPosition, ':');
    let yellowCount = 0;
    for (let i = fromPosition + 1; i <= 133 && yellowCount < 3; i++) {
        if (colors[i % colors.length] === 'yellow') {
            yellowCount++;
            console.log(`Yellow #${yellowCount}: Position ${i} (${i} % 6 = ${i % 6})`);
        }
    }
}

// Enhanced debug function to test the entire color pattern
function debugColorPattern() {
    console.log('🔍 DEBUGGING ENTIRE COLOR PATTERN:');
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

    console.log('Color array:', colors);
    console.log('Array indices: [0, 1, 2, 3, 4, 5]');
    console.log('Expected pattern: red(0), blue(1), yellow(2), green(3), orange(4), purple(5)');

    console.log('\nFirst 20 positions:');
    for (let i = 0; i < 20; i++) {
        const color = colors[i % colors.length];
        const index = i % colors.length;
        console.log(`Position ${i}: ${color} (index ${index})`);
    }

    console.log('\nYellow positions (should be 2, 8, 14, 20, 26, 32, etc.):');
    for (let i = 0; i <= 50; i++) {
        if (colors[i % colors.length] === 'yellow') {
            console.log(`Position ${i}: YELLOW (${i} % 6 = ${i % 6})`);
        }
    }
}

// Function to verify board colors match calculation
function verifyBoardColors() {
    console.log('🔍 VERIFYING BOARD COLORS MATCH CALCULATION:');
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

    // Check first 20 positions on the actual board
    for (let i = 0; i < 20; i++) {
        const calculatedColor = colors[i % colors.length];
        const boardElement = document.querySelector(`#timeline-segment-${i}`);

        if (boardElement) {
            const computedStyle = window.getComputedStyle(boardElement);
            const backgroundColor = computedStyle.backgroundColor;

            // Map hex colors to color names
            const colorMap = {
                'rgb(239, 68, 68)': 'red',
                'rgb(59, 130, 246)': 'blue',
                'rgb(234, 179, 8)': 'yellow',
                'rgb(34, 197, 94)': 'green',
                'rgb(249, 115, 22)': 'orange',
                'rgb(139, 92, 246)': 'purple'
            };

            const actualColor = colorMap[backgroundColor] || 'unknown';
            const match = calculatedColor === actualColor ? '✅' : '❌';

            console.log(`Position ${i}: Calculated=${calculatedColor}, Actual=${actualColor} ${match}`);
        }
    }
}

// Make variables and functions available globally for the game
window.gameState = gameState;
window.playerColors = playerColors;
window.playerEmojis = playerEmojis;
window.cardTypes = cardTypes;
window.gameConfig = gameConfig;
window.initializeGame = initializeGame;
window.resetGameState = resetGameState;
window.createPlayer = createPlayer;
window.getCurrentPlayer = getCurrentPlayer;
window.getNextPlayer = getNextPlayer;
window.advanceToNextPlayer = advanceToNextPlayer;
window.drawCardFromDeck = drawCardFromDeck;
window.getCardEmoji = getCardEmoji;
window.getCardText = getCardText;
window.calculateTargetPosition = calculateTargetPosition;
window.checkSpecialSquareEffects = checkSpecialSquareEffects;
window.checkWinCondition = checkWinCondition;
window.getColorAtPosition = getColorAtPosition;
window.findAllColorPositions = findAllColorPositions;
window.testYellowMovement = testYellowMovement;
window.debugColorPattern = debugColorPattern;
window.verifyBoardColors = verifyBoardColors;
window.createWheelDeck = createWheelDeck;
window.getAvailableWheelCards = getAvailableWheelCards;
window.markCardAsUsed = markCardAsUsed;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameState,
        playerColors,
        playerEmojis,
        cardTypes,
        gameConfig,
        initializeGame,
        resetGameState,
        createPlayer,
        getCurrentPlayer,
        getNextPlayer,
        advanceToNextPlayer,
        drawCardFromDeck,
        getCardEmoji,
        getCardText,
        calculateTargetPosition,
        checkSpecialSquareEffects,
        checkWinCondition
    };
}
