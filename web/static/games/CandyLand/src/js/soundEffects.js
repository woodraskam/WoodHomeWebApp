// Candyland Adventure - Sound Effects using Web Audio API

let audioContext = null;

// Initialize audio context
function initializeAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
        audioContext = null;
    }
}

// Enhanced sound effects using Web Audio API
function playSound(type, options = {}) {
    if (!audioContext) {
        initializeAudio();
    }
    
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const { frequency = 440, volume = 0.3, duration = 0.2 } = options;
        
        switch(type) {
            case 'select':
                playSelectSound(oscillator, gainNode);
                break;
            case 'start':
                playStartSound(oscillator, gainNode);
                break;
            case 'card':
                playCardSound(oscillator, gainNode);
                break;
            case 'move':
                playMoveSound(oscillator, gainNode);
                break;
            case 'special':
                playSpecialSound(oscillator, gainNode);
                break;
        case 'victory':
            playVictorySound();
            return; // Victory sound handles its own oscillators
        case 'tick':
            playTickSound(oscillator, gainNode);
            break;
        case 'error':
            playErrorSound(oscillator, gainNode);
            break;
        case 'success':
            playSuccessSound(oscillator, gainNode);
            break;
            default:
                playDefaultSound(oscillator, gainNode, frequency, volume, duration);
        }
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

function playSelectSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playStartSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playCardSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playMoveSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playSpecialSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.4);
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.8);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
}

function playVictorySound() {
    // Victory fanfare with multiple notes
    const notes = [
        { freq: 800, time: 0, duration: 0.3 },
        { freq: 1000, time: 0.2, duration: 0.3 },
        { freq: 1200, time: 0.4, duration: 0.3 },
        { freq: 1500, time: 0.6, duration: 0.5 },
        { freq: 1200, time: 0.9, duration: 0.3 },
        { freq: 1500, time: 1.1, duration: 0.8 }
    ];
    
    notes.forEach(note => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(note.freq, audioContext.currentTime);
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + note.duration);
        }, note.time * 1000);
    });
}

function playErrorSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playSuccessSound(oscillator, gainNode) {
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playTickSound(oscillator, gainNode) {
    // Short, sharp tick sound for card spinning
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
}

function playDefaultSound(oscillator, gainNode, frequency, volume, duration) {
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Play a sequence of sounds
function playSoundSequence(sounds, interval = 200) {
    sounds.forEach((sound, index) => {
        setTimeout(() => {
            if (typeof sound === 'string') {
                playSound(sound);
            } else {
                playSound(sound.type, sound.options);
            }
        }, index * interval);
    });
}

// Play a chord (multiple frequencies simultaneously)
function playChord(frequencies, duration = 0.5, volume = 0.2) {
    if (!audioContext) return;
    
    frequencies.forEach(freq => {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Error playing chord note:', e);
        }
    });
}

// Play a melody
function playMelody(notes, tempo = 120) {
    const beatDuration = 60 / tempo; // Duration of one beat in seconds
    let currentTime = 0;
    
    notes.forEach(note => {
        setTimeout(() => {
            if (note.frequency && note.frequency > 0) {
                playSound('default', {
                    frequency: note.frequency,
                    volume: note.volume || 0.2,
                    duration: note.duration || beatDuration
                });
            }
        }, currentTime * 1000);
        
        currentTime += note.duration || beatDuration;
    });
}

// Create ambient background sounds
function playAmbientSound(type, duration = 5000) {
    if (!audioContext) return;
    
    const ambientGain = audioContext.createGain();
    ambientGain.connect(audioContext.destination);
    ambientGain.gain.setValueAtTime(0.05, audioContext.currentTime);
    
    switch (type) {
        case 'magical':
            playMagicalAmbient(ambientGain, duration);
            break;
        case 'celebration':
            playCelebrationAmbient(ambientGain, duration);
            break;
        case 'suspense':
            playSuspenseAmbient(ambientGain, duration);
            break;
    }
}

function playMagicalAmbient(gainNode, duration) {
    const frequencies = [220, 330, 440, 550];
    const startTime = audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration / 1000);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration / 1000);
    });
}

function playCelebrationAmbient(gainNode, duration) {
    // Rapid sequence of ascending notes
    const baseFreq = 400;
    const noteCount = 20;
    const noteInterval = duration / noteCount / 1000;
    
    for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            oscillator.connect(gainNode);
            oscillator.frequency.setValueAtTime(baseFreq * (1 + i * 0.1), audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }, i * noteInterval * 1000);
    }
}

function playSuspenseAmbient(gainNode, duration) {
    const oscillator = audioContext.createOscillator();
    oscillator.connect(gainNode);
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration / 1000);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Volume control
let masterVolume = 1.0;

function setMasterVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, volume));
}

function getMasterVolume() {
    return masterVolume;
}

// Mute/unmute functionality
let isMuted = false;

function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

function isSoundMuted() {
    return isMuted;
}

// Override playSound to respect mute and volume settings
const originalPlaySound = playSound;
playSound = function(type, options = {}) {
    if (isMuted) return;
    
    const adjustedOptions = {
        ...options,
        volume: (options.volume || 0.3) * masterVolume
    };
    
    originalPlaySound(type, adjustedOptions);
};

// Initialize audio on first user interaction
function initializeAudioOnInteraction() {
    const initAudio = () => {
        if (!audioContext) {
            initializeAudio();
        }
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Remove event listeners after first interaction
        document.removeEventListener('click', initAudio);
        document.removeEventListener('keydown', initAudio);
        document.removeEventListener('touchstart', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);
}

// Make functions available globally for the game
window.initializeAudio = initializeAudio;
window.playSound = playSound;
window.playSoundSequence = playSoundSequence;
window.playChord = playChord;
window.playMelody = playMelody;
window.playAmbientSound = playAmbientSound;
window.setMasterVolume = setMasterVolume;
window.getMasterVolume = getMasterVolume;
window.toggleMute = toggleMute;
window.isSoundMuted = isSoundMuted;
window.initializeAudioOnInteraction = initializeAudioOnInteraction;

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAudio,
        playSound,
        playSoundSequence,
        playChord,
        playMelody,
        playAmbientSound,
        setMasterVolume,
        getMasterVolume,
        toggleMute,
        isSoundMuted,
        initializeAudioOnInteraction
    };
}
