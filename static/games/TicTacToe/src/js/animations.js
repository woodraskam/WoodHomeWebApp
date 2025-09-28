// Tic Tac Toe - Animations and Visual Effects

// Initialize animations
function initializeAnimations() {
    console.log('🎨 Initializing Tic Tac Toe animations...');
    
    // Setup confetti system
    setupConfettiSystem();
    
    // Setup sound effects
    setupSoundEffects();
    
    console.log('✅ Animations initialized');
}

// Create confetti effect
function createConfettiEffect() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        console.warn('⚠️ Confetti canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const confettiParticles = [];
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create confetti particles
    for (let i = 0; i < 100; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: -10,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            color: getRandomColor(),
            size: Math.random() * 8 + 4,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        });
    }
    
    // Animate confetti
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let activeParticles = 0;
        
        confettiParticles.forEach(particle => {
            if (particle.y < canvas.height + 10) {
                // Update particle position
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;
                
                // Apply gravity
                particle.vy += 0.1;
                
                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation * Math.PI / 180);
                ctx.fillStyle = particle.color;
                ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                ctx.restore();
                
                activeParticles++;
            }
        });
        
        if (activeParticles > 0) {
            requestAnimationFrame(animateConfetti);
        } else {
            // Clear canvas when animation is complete
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animateConfetti();
    console.log('🎉 Confetti effect created');
}

// Get random color for confetti
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Setup confetti system
function setupConfettiSystem() {
    // Create confetti canvas if it doesn't exist
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.appendChild(canvas);
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Setup sound effects
function setupSoundEffects() {
    // Create audio context for sound effects
    if (!window.audioContext) {
        try {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('⚠️ Web Audio API not supported:', error);
        }
    }
}

// Play sound effect
function playSoundEffect(type) {
    if (!gameState.settings.soundEnabled || !window.audioContext) {
        return;
    }
    
    try {
        const audioContext = window.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'move':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'victory':
                // Victory fanfare
                [800, 1000, 1200, 1500].forEach((freq, i) => {
                    setTimeout(() => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(audioContext.destination);
                        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        osc.start(audioContext.currentTime);
                        osc.stop(audioContext.currentTime + 0.3);
                    }, i * 100);
                });
                break;
                
            case 'draw':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
                
            case 'ai':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (error) {
        console.warn('⚠️ Sound effect failed:', error);
    }
}

// Add cell entrance animation
function addCellEntranceAnimation(cellIndex) {
    const cell = document.getElementById(`cell-${cellIndex}`);
    if (!cell) return;
    
    // Add entrance animation
    cell.style.animation = 'cellPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    // Remove animation after it completes
    setTimeout(() => {
        cell.style.animation = '';
    }, 500);
}

// Add winning line animation
function addWinningLineAnimation(winningLine) {
    if (!winningLine) return;
    
    winningLine.forEach((index, i) => {
        const cell = document.getElementById(`cell-${index}`);
        if (cell) {
            // Stagger the animation for each cell
            setTimeout(() => {
                cell.style.animation = 'winningPulse 1s ease-in-out infinite';
            }, i * 200);
        }
    });
}

// Add board shake animation
function addBoardShakeAnimation() {
    const board = document.getElementById('tic-tac-toe-board');
    if (!board) return;
    
    board.style.animation = 'boardShake 0.5s ease-in-out';
    
    setTimeout(() => {
        board.style.animation = '';
    }, 500);
}

// Add victory screen entrance animation
function addVictoryScreenAnimation() {
    const victoryContent = document.querySelector('.victory-content');
    if (!victoryContent) return;
    
    victoryContent.style.animation = 'victoryEntrance 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
}

// Add floating pieces animation
function addFloatingPiecesAnimation() {
    const pieces = document.querySelectorAll('.floating-piece');
    pieces.forEach((piece, index) => {
        // Stagger the animation
        piece.style.animationDelay = `${index * 0.5}s`;
    });
}

// Add button hover animation
function addButtonHoverAnimation(button) {
    if (!button) return;
    
    button.addEventListener('mouseenter', () => {
        button.style.animation = 'buttonHover 0.3s ease';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.animation = '';
    });
}

// Add cell hover animation
function addCellHoverAnimation(cell) {
    if (!cell) return;
    
    cell.addEventListener('mouseenter', () => {
        if (!cell.textContent && isGameActive() && !isAITurn()) {
            cell.style.animation = 'cellHover 0.3s ease';
        }
    });
    
    cell.addEventListener('mouseleave', () => {
        cell.style.animation = '';
    });
}

// Add game board entrance animation
function addGameBoardEntranceAnimation() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;
    
    gameBoard.style.animation = 'boardEntrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
}

// Add start screen fade out animation
function addStartScreenFadeOutAnimation() {
    const startScreen = document.getElementById('start-screen');
    if (!startScreen) return;
    
    startScreen.classList.add('fade-out');
}

// Add game board fade in animation
function addGameBoardFadeInAnimation() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;
    
    gameBoard.classList.add('fade-in');
}

// Add AI thinking animation
function addAIThinkingAnimation() {
    const board = document.getElementById('tic-tac-toe-board');
    if (!board) return;
    
    board.classList.add('ai-thinking');
}

// Remove AI thinking animation
function removeAIThinkingAnimation() {
    const board = document.getElementById('tic-tac-toe-board');
    if (!board) return;
    
    board.classList.remove('ai-thinking');
}

// Add celebration animation
function addCelebrationAnimation() {
    // Add confetti
    createConfettiEffect();
    
    // Add screen shake
    document.body.style.animation = 'screenShake 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

// Add screen shake animation
function addScreenShakeAnimation() {
    document.body.style.animation = 'screenShake 0.3s ease-in-out';
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 300);
}

// Make functions globally accessible
window.initializeAnimations = initializeAnimations;
window.createConfettiEffect = createConfettiEffect;
window.playSoundEffect = playSoundEffect;
window.addCellEntranceAnimation = addCellEntranceAnimation;
window.addWinningLineAnimation = addWinningLineAnimation;
window.addBoardShakeAnimation = addBoardShakeAnimation;
window.addVictoryScreenAnimation = addVictoryScreenAnimation;
window.addFloatingPiecesAnimation = addFloatingPiecesAnimation;
window.addButtonHoverAnimation = addButtonHoverAnimation;
window.addCellHoverAnimation = addCellHoverAnimation;
window.addGameBoardEntranceAnimation = addGameBoardEntranceAnimation;
window.addStartScreenFadeOutAnimation = addStartScreenFadeOutAnimation;
window.addGameBoardFadeInAnimation = addGameBoardFadeInAnimation;
window.addAIThinkingAnimation = addAIThinkingAnimation;
window.removeAIThinkingAnimation = removeAIThinkingAnimation;
window.addCelebrationAnimation = addCelebrationAnimation;
window.addScreenShakeAnimation = addScreenShakeAnimation;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAnimations,
        createConfettiEffect,
        playSoundEffect,
        addCellEntranceAnimation,
        addWinningLineAnimation,
        addBoardShakeAnimation,
        addVictoryScreenAnimation,
        addFloatingPiecesAnimation,
        addButtonHoverAnimation,
        addCellHoverAnimation,
        addGameBoardEntranceAnimation,
        addStartScreenFadeOutAnimation,
        addGameBoardFadeInAnimation,
        addAIThinkingAnimation,
        removeAIThinkingAnimation,
        addCelebrationAnimation,
        addScreenShakeAnimation
    };
}
