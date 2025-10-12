/**
 * Woodraska Cribbage - Card Animations
 * Handles card flip animations, card play animations, score update animations, and transition effects
 */

class CribbageCardAnimations {
    constructor() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.animationSpeed = 300; // Default animation speed in ms
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Animation presets
        this.presets = {
            fast: 150,
            normal: 300,
            slow: 500
        };
    }

    /**
     * Initialize animations
     */
    init() {
        this.setupAnimationStyles();
        this.setupEventListeners();
    }

    /**
     * Setup animation styles
     */
    setupAnimationStyles() {
        if (document.getElementById('cribbage-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'cribbage-animations';
        style.textContent = `
            .card-animation {
                transition: all 0.3s ease;
            }
            
            .card-flip {
                animation: cardFlip 0.6s ease-in-out;
            }
            
            .card-deal {
                animation: cardDeal 0.8s ease-out;
            }
            
            .card-play {
                animation: cardPlay 0.5s ease-out;
            }
            
            .card-discard {
                animation: cardDiscard 0.6s ease-in-out;
            }
            
            .card-select {
                animation: cardSelect 0.3s ease-out;
            }
            
            .card-hover {
                animation: cardHover 0.2s ease-out;
            }
            
            .score-update {
                animation: scoreUpdate 0.8s ease-out;
            }
            
            .score-flash {
                animation: scoreFlash 1.2s ease-out;
            }
            
            .fade-in {
                animation: fadeIn 0.5s ease-out;
            }
            
            .fade-out {
                animation: fadeOut 0.3s ease-in;
            }
            
            .slide-in-left {
                animation: slideInLeft 0.5s ease-out;
            }
            
            .slide-in-right {
                animation: slideInRight 0.5s ease-out;
            }
            
            .zoom-in {
                animation: zoomIn 0.3s ease-out;
            }
            
            .zoom-out {
                animation: zoomOut 0.3s ease-in;
            }
            
            .bounce {
                animation: bounce 1s ease-in-out;
            }
            
            .shake {
                animation: shake 0.5s ease-in-out;
            }
            
            .pulse {
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes cardFlip {
                0% { transform: rotateY(0deg); }
                50% { transform: rotateY(90deg); }
                100% { transform: rotateY(0deg); }
            }
            
            @keyframes cardDeal {
                0% { transform: translateY(-100px) rotate(-10deg); opacity: 0; }
                50% { transform: translateY(-20px) rotate(5deg); opacity: 0.8; }
                100% { transform: translateY(0) rotate(0deg); opacity: 1; }
            }
            
            @keyframes cardPlay {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                25% { transform: scale(1.1) rotate(5deg); opacity: 0.9; }
                50% { transform: scale(1.05) rotate(-2deg); opacity: 0.95; }
                75% { transform: scale(1.02) rotate(1deg); opacity: 0.98; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            @keyframes cardDiscard {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                50% { transform: scale(0.8) rotate(180deg); opacity: 0.7; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            @keyframes cardSelect {
                0% { transform: scale(1); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
                50% { transform: scale(1.05); box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3); }
                100% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4); }
            }
            
            @keyframes cardHover {
                0% { transform: translateY(0); }
                100% { transform: translateY(-4px); }
            }
            
            @keyframes scoreUpdate {
                0% { transform: scale(1); background: var(--cribbage-surface); }
                50% { transform: scale(1.1); background: var(--cribbage-secondary); color: var(--cribbage-on-secondary); }
                100% { transform: scale(1); background: var(--cribbage-surface); }
            }
            
            @keyframes scoreFlash {
                0% { background: var(--cribbage-surface); color: var(--cribbage-on-surface); }
                25% { background: var(--cribbage-primary); color: var(--cribbage-on-primary); }
                50% { background: var(--cribbage-secondary); color: var(--cribbage-on-secondary); }
                75% { background: var(--cribbage-primary); color: var(--cribbage-on-primary); }
                100% { background: var(--cribbage-surface); color: var(--cribbage-on-surface); }
            }
            
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                0% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
            
            @keyframes slideInLeft {
                0% { transform: translateX(-100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideInRight {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes zoomIn {
                0% { transform: scale(0); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes zoomOut {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(0); opacity: 0; }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for reduced motion preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
        });
    }

    /**
     * Animate card flip
     */
    animateCardFlip(card, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        card.classList.add('card-flip');
        
        setTimeout(() => {
            card.classList.remove('card-flip');
            if (callback) callback();
        }, 600);
    }

    /**
     * Animate card deal
     */
    animateCardDeal(card, delay = 0) {
        if (this.reducedMotion) return;
        
        setTimeout(() => {
            card.classList.add('card-deal');
            
            setTimeout(() => {
                card.classList.remove('card-deal');
            }, 800);
        }, delay);
    }

    /**
     * Animate card play
     */
    animateCardPlay(card, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        card.classList.add('card-play');
        
        setTimeout(() => {
            card.classList.remove('card-play');
            if (callback) callback();
        }, 500);
    }

    /**
     * Animate card discard
     */
    animateCardDiscard(card, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        card.classList.add('card-discard');
        
        setTimeout(() => {
            card.classList.remove('card-discard');
            if (callback) callback();
        }, 600);
    }

    /**
     * Animate card selection
     */
    animateCardSelect(card) {
        if (this.reducedMotion) return;
        
        card.classList.add('card-select');
        
        setTimeout(() => {
            card.classList.remove('card-select');
        }, 300);
    }

    /**
     * Animate card hover
     */
    animateCardHover(card) {
        if (this.reducedMotion) return;
        
        card.classList.add('card-hover');
        
        setTimeout(() => {
            card.classList.remove('card-hover');
        }, 200);
    }

    /**
     * Animate score update
     */
    animateScoreUpdate(scoreElement, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        scoreElement.classList.add('score-update');
        
        setTimeout(() => {
            scoreElement.classList.remove('score-update');
            if (callback) callback();
        }, 800);
    }

    /**
     * Animate score flash
     */
    animateScoreFlash(scoreElement, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        scoreElement.classList.add('score-flash');
        
        setTimeout(() => {
            scoreElement.classList.remove('score-flash');
            if (callback) callback();
        }, 1200);
    }

    /**
     * Animate fade in
     */
    animateFadeIn(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('fade-in');
        
        setTimeout(() => {
            element.classList.remove('fade-in');
            if (callback) callback();
        }, 500);
    }

    /**
     * Animate fade out
     */
    animateFadeOut(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('fade-out');
        
        setTimeout(() => {
            element.classList.remove('fade-out');
            if (callback) callback();
        }, 300);
    }

    /**
     * Animate slide in from left
     */
    animateSlideInLeft(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('slide-in-left');
        
        setTimeout(() => {
            element.classList.remove('slide-in-left');
            if (callback) callback();
        }, 500);
    }

    /**
     * Animate slide in from right
     */
    animateSlideInRight(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('slide-in-right');
        
        setTimeout(() => {
            element.classList.remove('slide-in-right');
            if (callback) callback();
        }, 500);
    }

    /**
     * Animate zoom in
     */
    animateZoomIn(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('zoom-in');
        
        setTimeout(() => {
            element.classList.remove('zoom-in');
            if (callback) callback();
        }, 300);
    }

    /**
     * Animate zoom out
     */
    animateZoomOut(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('zoom-out');
        
        setTimeout(() => {
            element.classList.remove('zoom-out');
            if (callback) callback();
        }, 300);
    }

    /**
     * Animate bounce
     */
    animateBounce(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('bounce');
        
        setTimeout(() => {
            element.classList.remove('bounce');
            if (callback) callback();
        }, 1000);
    }

    /**
     * Animate shake
     */
    animateShake(element, callback = null) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.classList.add('shake');
        
        setTimeout(() => {
            element.classList.remove('shake');
            if (callback) callback();
        }, 500);
    }

    /**
     * Animate pulse
     */
    animatePulse(element, duration = 2000) {
        if (this.reducedMotion) return;
        
        element.classList.add('pulse');
        
        setTimeout(() => {
            element.classList.remove('pulse');
        }, duration);
    }

    /**
     * Animate multiple cards dealing
     */
    animateDealCards(cards, delayBetweenCards = 100) {
        if (this.reducedMotion) return;
        
        cards.forEach((card, index) => {
            this.animateCardDeal(card, index * delayBetweenCards);
        });
    }

    /**
     * Animate multiple cards playing
     */
    animatePlayCards(cards, delayBetweenCards = 150) {
        if (this.reducedMotion) return;
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                this.animateCardPlay(card);
            }, index * delayBetweenCards);
        });
    }

    /**
     * Animate multiple cards discarding
     */
    animateDiscardCards(cards, delayBetweenCards = 200) {
        if (this.reducedMotion) return;
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                this.animateCardDiscard(card);
            }, index * delayBetweenCards);
        });
    }

    /**
     * Animate score sequence
     */
    animateScoreSequence(scores, delayBetweenScores = 300) {
        if (this.reducedMotion) return;
        
        scores.forEach((score, index) => {
            setTimeout(() => {
                this.animateScoreUpdate(score.element);
            }, index * delayBetweenScores);
        });
    }

    /**
     * Animate game over celebration
     */
    animateGameOver(winnerElement) {
        if (this.reducedMotion) return;
        
        this.animateBounce(winnerElement);
        this.animateScoreFlash(winnerElement);
    }

    /**
     * Animate error state
     */
    animateError(element) {
        if (this.reducedMotion) return;
        
        this.animateShake(element);
    }

    /**
     * Animate loading state
     */
    animateLoading(element) {
        if (this.reducedMotion) return;
        
        this.animatePulse(element, 2000);
    }

    /**
     * Animate success state
     */
    animateSuccess(element) {
        if (this.reducedMotion) return;
        
        this.animateBounce(element);
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        if (typeof speed === 'string' && this.presets[speed]) {
            this.animationSpeed = this.presets[speed];
        } else if (typeof speed === 'number') {
            this.animationSpeed = speed;
        }
    }

    /**
     * Get animation speed
     */
    getAnimationSpeed() {
        return this.animationSpeed;
    }

    /**
     * Check if animations are enabled
     */
    areAnimationsEnabled() {
        return !this.reducedMotion;
    }

    /**
     * Enable animations
     */
    enableAnimations() {
        this.reducedMotion = false;
    }

    /**
     * Disable animations
     */
    disableAnimations() {
        this.reducedMotion = true;
    }

    /**
     * Queue animation
     */
    queueAnimation(animation) {
        this.animationQueue.push(animation);
        this.processAnimationQueue();
    }

    /**
     * Process animation queue
     */
    processAnimationQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) return;
        
        this.isAnimating = true;
        const animation = this.animationQueue.shift();
        
        animation(() => {
            this.isAnimating = false;
            this.processAnimationQueue();
        });
    }

    /**
     * Clear animation queue
     */
    clearAnimationQueue() {
        this.animationQueue = [];
        this.isAnimating = false;
    }

    /**
     * Get animation queue status
     */
    getAnimationQueueStatus() {
        return {
            queueLength: this.animationQueue.length,
            isAnimating: this.isAnimating,
            animationsEnabled: this.areAnimationsEnabled()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CribbageCardAnimations;
}
