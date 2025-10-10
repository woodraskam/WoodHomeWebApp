// Tic Tac Toe - Main Application Entry Point

// Initialize application when page loads
window.addEventListener('load', () => {
    initializeApplication();
});

// Main initialization function
function initializeApplication() {
    console.log('🎯 Initializing Tic Tac Toe...');

    // Initialize all game systems
    initializeGameState();
    initializeGameLogic();
    initializeAnimations();
    initializeUI();

    // Setup global event listeners
    setupGlobalEventListeners();

    // Initialize floating pieces
    initializeFloatingPieces();

    // Initialize character selection
    updateFloatingPieces();

    console.log('✅ Tic Tac Toe ready to play!');
}

// Initialize UI elements
function initializeUI() {
    console.log('🎨 Initializing UI...');

    // Setup game mode selection
    setupGameModeSelection();

    // Setup button animations
    setupButtonAnimations();

    // Initialize stats display
    updateStatsDisplay();

    console.log('✅ UI initialized');
}

// Setup game mode selection
function setupGameModeSelection() {
    const modeButtons = document.querySelectorAll('.mode-btn');

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove selected class from all buttons
            modeButtons.forEach(btn => btn.classList.remove('selected'));

            // Add selected class to clicked button
            button.classList.add('selected');

            // Enable start button
            const startBtn = document.getElementById('start-game-btn');
            if (startBtn) {
                startBtn.disabled = false;
            }

            // Add selection animation
            button.style.animation = 'modeSelected 0.5s ease';
            setTimeout(() => {
                button.style.animation = '';
            }, 500);
        });
    });
}

// Setup button animations
function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn, .mode-btn, .start-btn');

    buttons.forEach(button => {
        addButtonHoverAnimation(button);
    });
}

// Initialize floating pieces
function initializeFloatingPieces() {
    const pieces = document.querySelectorAll('.floating-piece');
    pieces.forEach((piece, index) => {
        // Stagger the animation
        piece.style.animationDelay = `${index * 0.5}s`;
    });
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        adjustForScreenSize();
    }, 250));

    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            adjustForScreenSize();
        }, 100);
    });

    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseGame();
        } else {
            resumeGame();
        }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
        cleanupAnimations();
    });

    // Global error handling
    window.addEventListener('error', (event) => {
        console.error('Game error:', event.error);
    });
}

// Adjust for screen size
function adjustForScreenSize() {
    const board = document.getElementById('tic-tac-toe-board');
    if (!board) return;

    const screenWidth = window.innerWidth;

    if (screenWidth < 480) {
        // Small screens
        board.style.width = '250px';
        board.style.height = '250px';
    } else if (screenWidth < 768) {
        // Medium screens
        board.style.width = '300px';
        board.style.height = '300px';
    } else {
        // Large screens
        board.style.width = '400px';
        board.style.height = '400px';
    }
}

// Pause game functionality
function pauseGame() {
    const animatedElements = document.querySelectorAll('.floating-piece, .board-cell');
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'paused';
    });
}

// Resume game functionality
function resumeGame() {
    const animatedElements = document.querySelectorAll('.floating-piece, .board-cell');
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'running';
    });
}

// Cleanup animations
function cleanupAnimations() {
    const animatedElements = document.querySelectorAll('.floating-piece, .board-cell');
    animatedElements.forEach(element => {
        element.style.animation = 'none';
    });
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Game mode selection functions
function selectGameMode(mode) {
    console.log(`🎮 Game mode selected: ${mode}`);
    setGameMode(mode);

    // Update UI
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.mode === mode) {
            btn.classList.add('selected');
        }
    });

    // Enable start button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.disabled = false;
    }
}

// Character set selection functions
function selectCharacterSet(characterSet) {
    console.log(`🎭 Character set selected: ${characterSet}`);
    setCharacterSet(characterSet);

    // Update UI
    const characterButtons = document.querySelectorAll('.character-btn');
    characterButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.characters === characterSet) {
            btn.classList.add('selected');
        }
    });

    // Update floating pieces
    updateFloatingPieces();
}

// Update floating pieces based on character selection
function updateFloatingPieces() {
    const container = document.getElementById('floating-pieces-container');
    if (!container) return;

    // Clear existing pieces
    container.innerHTML = '';

    const characterImages = getCharacterImages();
    const positions = [
        { top: '5%', left: '10%', delay: '0s' },
        { top: '15%', left: '85%', delay: '1s' },
        { top: '25%', left: '5%', delay: '2s' },
        { top: '35%', left: '90%', delay: '3s' },
        { top: '45%', left: '15%', delay: '4s' },
        { top: '55%', left: '80%', delay: '5s' },
        { top: '65%', left: '10%', delay: '0.5s' },
        { top: '75%', left: '85%', delay: '1.5s' },
        { top: '85%', left: '20%', delay: '2.5s' },
        { top: '95%', left: '75%', delay: '3.5s' }
    ];

    positions.forEach((pos, index) => {
        const piece = document.createElement('div');
        piece.className = 'floating-piece';
        piece.style.top = pos.top;
        piece.style.left = pos.left;
        piece.style.animationDelay = pos.delay;

        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        // Alternate between X and O characters
        if (index % 2 === 0) {
            img.src = characterImages.X;
            img.alt = characterImages.XName;
        } else {
            img.src = characterImages.O;
            img.alt = characterImages.OName;
        }

        piece.appendChild(img);
        container.appendChild(piece);
    });
}

// Make functions globally accessible
window.selectGameMode = selectGameMode;
window.selectCharacterSet = selectCharacterSet;

// Feature detection
function detectFeatures() {
    const features = {
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        animations: 'animation' in document.documentElement.style,
        transforms3d: 'perspective' in document.documentElement.style,
        touch: 'ontouchstart' in window,
        localStorage: typeof Storage !== 'undefined'
    };

    console.log('🔍 Feature detection:', features);

    // Adjust game based on available features
    if (!features.webAudio) {
        console.warn('Web Audio API not supported - sounds disabled');
        gameState.settings.soundEnabled = false;
    }

    if (!features.localStorage) {
        console.warn('LocalStorage not supported - statistics will not be saved');
    }

    if (features.touch) {
        console.log('Touch device detected - enabling touch-friendly features');
        document.body.classList.add('touch-device');
    }

    return features;
}

// Accessibility enhancements
function enhanceAccessibility() {
    // Add ARIA labels to interactive elements
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
            button.setAttribute('aria-label', 'Game button');
        }
    });

    // Add keyboard navigation hints
    const interactiveElements = document.querySelectorAll('button, .board-cell');
    interactiveElements.forEach((element, index) => {
        element.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Handle focus management
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // Add reduced motion support
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
        gameState.settings.animationsEnabled = false;
        console.log('Reduced motion preference detected');
    }
}

// Development mode helpers
function initializeDevMode() {
    if (window.location.search.includes('dev=true') || window.location.hostname === 'localhost') {
        console.log('🛠️ Development mode enabled');

        // Add dev tools
        window.tictactoeDev = {
            gameState,
            // Utility functions for testing
            skipToWin: () => {
                gameState.gameBoard = ['X', 'X', '', 'O', 'O', '', '', '', ''];
                updateBoardDisplay();
            },
            resetBoard: () => {
                resetGame();
                resetBoardDisplay();
            },
            playSound: (type) => playSoundEffect(type),
            toggleMute: () => {
                gameState.settings.soundEnabled = !gameState.settings.soundEnabled;
                console.log('Sound enabled:', gameState.settings.soundEnabled);
            },
            addConfetti: () => createConfettiEffect()
        };

        console.log('Dev tools available at window.tictactoeDev');
    }
}

// Update board display
function updateBoardDisplay() {
    const board = getGameBoard();

    for (let i = 0; i < board.length; i++) {
        const cell = document.getElementById(`cell-${i}`);
        if (cell) {
            if (board[i]) {
                // Clear existing content
                cell.textContent = '';
                cell.innerHTML = '';

                // Create image element
                const img = document.createElement('img');
                img.style.width = '80%';
                img.style.height = '80%';
                img.style.objectFit = 'contain';

                // Set image source based on player and character set
                const characterImages = getCharacterImages();
                if (board[i] === 'X') {
                    img.src = characterImages.X;
                    img.alt = characterImages.XName;
                } else {
                    img.src = characterImages.O;
                    img.alt = characterImages.OName;
                }

                cell.appendChild(img);
                cell.className = `board-cell ${board[i].toLowerCase()}`;
                cell.disabled = true;
            } else {
                cell.textContent = '';
                cell.innerHTML = '';
                cell.className = 'board-cell';
                cell.disabled = false;
            }
        }
    }
}

// Initialize application with all features
function initializeApplication() {
    console.log('🎯 Initializing Tic Tac Toe...');

    // Core initialization
    initializeGameState();
    initializeGameLogic();
    initializeAnimations();
    initializeUI();

    // Enhanced features
    const features = detectFeatures();
    enhanceAccessibility();
    setupGlobalEventListeners();
    initializeDevMode();

    // Adjust for current screen
    adjustForScreenSize();

    console.log('✅ Tic Tac Toe ready to play!');
}

// Export for testing and development
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApplication,
        pauseGame,
        resumeGame,
        detectFeatures,
        enhanceAccessibility,
        selectGameMode,
        startGame,
        resetGame,
        playAgain,
        goHome
    };
}
