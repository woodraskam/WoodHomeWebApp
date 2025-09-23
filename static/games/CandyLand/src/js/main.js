// Candyland Adventure - Main Application Entry Point

// Initialize game when page loads
window.addEventListener('load', () => {
    initializeApplication();
});

// Main initialization function
function initializeApplication() {
    console.log('🍭 Initializing Candyland Adventure...');
    
    // Initialize all game systems
    initializeGame();
    initializeAudioOnInteraction();
    initializeKeyboardControls();
    initializeBoardEvents();
    initializeAnimationOptimizations();
    
    // Add global event listeners
    setupGlobalEventListeners();
    
    // Adjust board for current screen size
    adjustBoardForScreenSize();
    
    console.log('🎮 Candyland Adventure ready to play!');
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        adjustBoardForScreenSize();
    }, 250));
    
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            adjustBoardForScreenSize();
        }, 100);
    });
    
    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Game is now hidden, pause any ongoing animations
            pauseGame();
        } else {
            // Game is now visible, resume
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
        // Could show user-friendly error message here
    });
}

// Pause game functionality
function pauseGame() {
    // Pause any ongoing animations
    const animatedElements = document.querySelectorAll('.game-piece, .floating-candy');
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'paused';
    });
}

// Resume game functionality
function resumeGame() {
    // Resume animations
    const animatedElements = document.querySelectorAll('.game-piece, .floating-candy');
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'running';
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

// Performance monitoring
function monitorPerformance() {
    if (window.performance && window.performance.mark) {
        window.performance.mark('game-start');
        
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrames() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                console.log(`FPS: ${fps}`);
                
                // If FPS is too low, could reduce animation quality
                if (fps < 30) {
                    console.warn('Low FPS detected, consider reducing animation quality');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(countFrames);
        }
        
        requestAnimationFrame(countFrames);
    }
}

// Feature detection
function detectFeatures() {
    const features = {
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        animations: 'animation' in document.documentElement.style,
        transforms3d: 'perspective' in document.documentElement.style,
        touch: 'ontouchstart' in window,
        gamepad: 'getGamepads' in navigator,
        fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
    };
    
    console.log('🔍 Feature detection:', features);
    
    // Adjust game based on available features
    if (!features.webAudio) {
        console.warn('Web Audio API not supported - sounds disabled');
    }
    
    if (!features.transforms3d) {
        console.warn('3D transforms not supported - falling back to 2D');
        // Could disable 3D animations here
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
    const interactiveElements = document.querySelectorAll('button, .square');
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
        console.log('Reduced motion preference detected');
    }
}

// Development mode helpers
function initializeDevMode() {
    if (window.location.search.includes('dev=true') || window.location.hostname === 'localhost') {
        console.log('🛠️ Development mode enabled');
        
        // Add dev tools
        window.candylandDev = {
            gameState,
            playerColors,
            playerEmojis,
            cardTypes,
            gameConfig,
            // Utility functions for testing
            skipToEnd: () => {
                const currentPlayer = getCurrentPlayer();
                if (currentPlayer) {
                    currentPlayer.position = gameConfig.TOTAL_SQUARES - 1;
                    moveGamePieceToSquare(currentPlayer.id, currentPlayer.position);
                }
            },
            addConfetti: () => createMassiveConfetti(),
            playAllSounds: () => {
                ['select', 'start', 'card', 'move', 'special', 'victory'].forEach((sound, i) => {
                    setTimeout(() => playSound(sound), i * 500);
                });
            },
            resetGame: () => newGame(),
            toggleMute: () => toggleMute()
        };
        
        console.log('Dev tools available at window.candylandDev');
        
        // Enable performance monitoring
        monitorPerformance();
    }
}

// Service worker registration (for PWA capabilities)
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Save game state to localStorage (optional feature)
function saveGameState() {
    try {
        const saveData = {
            players: gameState.players,
            currentPlayer: gameState.currentPlayer,
            gameStarted: gameState.gameStarted,
            timestamp: Date.now()
        };
        localStorage.setItem('candyland-save', JSON.stringify(saveData));
    } catch (e) {
        console.warn('Could not save game state:', e);
    }
}

// Load game state from localStorage (optional feature)
function loadGameState() {
    try {
        const saveData = localStorage.getItem('candyland-save');
        if (saveData) {
            const data = JSON.parse(saveData);
            // Only load if save is recent (within 24 hours)
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
    } catch (e) {
        console.warn('Could not load game state:', e);
    }
    return null;
}

// Initialize application with all features
function initializeApplication() {
    console.log('🍭 Initializing Candyland Adventure...');
    
    // Core initialization
    initializeGame();
    initializeAudioOnInteraction();
    initializeKeyboardControls();
    initializeBoardEvents();
    initializeAnimationOptimizations();
    
    // Enhanced features
    const features = detectFeatures();
    enhanceAccessibility();
    setupGlobalEventListeners();
    initializeDevMode();
    
    // Optional features
    if (features.serviceWorker) {
        registerServiceWorker();
    }
    
    // Adjust for current screen
    adjustBoardForScreenSize();
    
    // Try to load saved game (but don't show alert since continue doesn't work)
    const savedGame = loadGameState();
    if (savedGame) {
        console.log('Saved game found but continue functionality not implemented');
    }
    
    console.log('🎮 Candyland Adventure ready to play!');
}

// Auto-save game state periodically
setInterval(() => {
    if (gameState.gameStarted) {
        saveGameState();
    }
}, 30000); // Save every 30 seconds

// Export for testing and development
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApplication,
        pauseGame,
        resumeGame,
        saveGameState,
        loadGameState,
        detectFeatures,
        enhanceAccessibility
    };
}
