// Candyland Adventure - Animation Effects

// Create celebration burst effect
function createCelebrationBurst(element) {
    if (!element) return;
    
    const colors = ['#FF1493', '#00BFFF', '#FFD700', '#32CD32', '#FF6347', '#9370DB'];
    
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.left = element.offsetLeft + 20 + 'px';
            particle.style.top = element.offsetTop + 20 + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '25';
            
            const angle = (i * 45) * (Math.PI / 180);
            const distance = 50 + Math.random() * 30;
            
            element.parentElement.appendChild(particle);
            
            setTimeout(() => {
                particle.style.transition = 'all 1s ease-out';
                particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
                particle.style.opacity = '0';
                
                setTimeout(() => particle.remove(), 1000);
            }, 50);
        }, i * 50);
    }
}

// Create massive confetti effect
function createMassiveConfetti() {
    const colors = ['#FF1493', '#00BFFF', '#FFD700', '#32CD32', '#FF6347', '#9370DB'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 6000);
        }, i * 50);
    }
}

// Animate element entrance
function animateElementEntrance(element, animationType = 'fadeIn', delay = 0) {
    if (!element) return;
    
    setTimeout(() => {
        switch (animationType) {
            case 'fadeIn':
                element.style.opacity = '0';
                element.style.animation = 'fadeIn 0.5s ease-in-out forwards';
                break;
            case 'slideInFromTop':
                element.style.transform = 'translateY(-50px)';
                element.style.opacity = '0';
                element.style.animation = 'slideInFromTop 0.5s ease-out forwards';
                break;
            case 'slideInFromBottom':
                element.style.transform = 'translateY(50px)';
                element.style.opacity = '0';
                element.style.animation = 'slideInFromBottom 0.5s ease-out forwards';
                break;
            case 'scaleIn':
                element.style.transform = 'scale(0)';
                element.style.opacity = '0';
                element.style.animation = 'scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
                break;
        }
    }, delay);
}

// Animate element exit
function animateElementExit(element, animationType = 'fadeOut', onComplete) {
    if (!element) return;
    
    switch (animationType) {
        case 'fadeOut':
            element.style.animation = 'fadeIn 0.5s ease-in-out reverse';
            break;
        case 'slideOutToTop':
            element.style.animation = 'slideInFromTop 0.5s ease-in reverse';
            break;
        case 'slideOutToBottom':
            element.style.animation = 'slideInFromBottom 0.5s ease-in reverse';
            break;
        case 'scaleOut':
            element.style.animation = 'scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) reverse';
            break;
    }
    
    setTimeout(() => {
        if (onComplete) onComplete();
    }, 500);
}

// Pulse animation for important elements
function pulseElement(element, duration = 1000) {
    if (!element) return;
    
    element.style.animation = `heartbeat ${duration}ms ease-in-out`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

// Wiggle animation for interactive elements
function wiggleElement(element, duration = 500) {
    if (!element) return;
    
    element.style.animation = `wiggle ${duration}ms ease-in-out`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

// Rainbow effect for special occasions
function rainbowEffect(element, duration = 2000) {
    if (!element) return;
    
    element.style.animation = `rainbow ${duration}ms linear infinite`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

// Floating animation for decorative elements
function floatElement(element, intensity = 20, duration = 3000) {
    if (!element) return;
    
    const startY = parseFloat(element.style.top) || 0;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            const y = startY + Math.sin(progress * Math.PI * 4) * intensity;
            element.style.transform = `translateY(${y}px)`;
            requestAnimationFrame(animate);
        } else {
            element.style.transform = `translateY(${startY}px)`;
        }
    }
    
    animate();
}

// Particle explosion effect
function createParticleExplosion(x, y, particleCount = 15, colors = null) {
    if (!colors) {
        colors = ['#FF1493', '#00BFFF', '#FFD700', '#32CD32', '#FF6347', '#9370DB'];
    }
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        document.body.appendChild(particle);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const gravity = 500;
        const startTime = Date.now();
        
        function animateParticle() {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed < 2) {
                const newX = x + Math.cos(angle) * velocity * elapsed;
                const newY = y + Math.sin(angle) * velocity * elapsed + 0.5 * gravity * elapsed * elapsed;
                
                particle.style.left = newX + 'px';
                particle.style.top = newY + 'px';
                particle.style.opacity = Math.max(0, 1 - elapsed / 2);
                
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
}

// Screen shake effect for dramatic moments
function shakeScreen(intensity = 10, duration = 500) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    const startTime = Date.now();
    
    function shake() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            const currentIntensity = intensity * (1 - progress);
            const x = (Math.random() - 0.5) * currentIntensity;
            const y = (Math.random() - 0.5) * currentIntensity;
            
            gameContainer.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        } else {
            gameContainer.style.transform = '';
        }
    }
    
    shake();
}

// Smooth color transition
function transitionColor(element, fromColor, toColor, duration = 1000) {
    if (!element) return;
    
    element.style.backgroundColor = fromColor;
    element.style.transition = `background-color ${duration}ms ease-in-out`;
    
    setTimeout(() => {
        element.style.backgroundColor = toColor;
    }, 50);
    
    setTimeout(() => {
        element.style.transition = '';
    }, duration + 100);
}

// Typewriter effect for text
function typewriterEffect(element, text, speed = 100) {
    if (!element) return;
    
    element.textContent = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize performance optimizations
function initializeAnimationOptimizations() {
    // Add will-change property to animated elements
    const animatedElements = document.querySelectorAll('.game-piece, .square, .floating-candy, .confetti');
    animatedElements.forEach(element => {
        element.style.willChange = 'transform';
    });
    
    // Use transform3d for hardware acceleration
    const transformElements = document.querySelectorAll('.game-piece');
    transformElements.forEach(element => {
        if (!element.style.transform.includes('translate3d')) {
            element.style.transform = 'translate3d(0, 0, 0)';
        }
    });
}

// Clean up animations and effects
function cleanupAnimations() {
    // Remove all temporary animation elements
    document.querySelectorAll('.confetti, .trail-effect, .particle').forEach(element => {
        element.remove();
    });
    
    // Reset animation styles
    document.querySelectorAll('*').forEach(element => {
        if (element.style.animation) {
            element.style.animation = '';
        }
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createCelebrationBurst,
        createMassiveConfetti,
        animateElementEntrance,
        animateElementExit,
        pulseElement,
        wiggleElement,
        rainbowEffect,
        floatElement,
        createParticleExplosion,
        shakeScreen,
        transitionColor,
        typewriterEffect,
        initializeAnimationOptimizations,
        cleanupAnimations
    };
}
