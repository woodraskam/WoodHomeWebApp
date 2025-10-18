// Memory Game - Emoji Card Management

class EmojiManager {
    constructor() {
        this.emojiSets = {
            animals: {
                name: 'Animals',
                emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
                description: 'Cute and friendly animals'
            },
            food: {
                name: 'Food',
                emojis: ['🍎', '🍊', '🍌', '🍇', '🍓', '🍑', '🍒', '🍅', '🥕', '🌽', '🍞', '🧀', '🍕', '🍔', '🌮', '🍰'],
                description: 'Delicious food items'
            },
            objects: {
                name: 'Objects',
                emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🚲', '🚁'],
                description: 'Vehicles and objects'
            },
            seasonal: {
                name: 'Seasonal',
                emojis: ['🎃', '👻', '🦇', '🍂', '🍁', '🎄', '⛄', '🎅', '🎁', '🧸', '🎈', '🎉', '🎊', '🎀', '🎂', '🍭'],
                description: 'Holiday and seasonal items'
            }
        };
        
        this.currentSet = 'animals';
        this.maxEmojisPerSet = 16;
    }

    // Get available emoji sets
    getAvailableSets() {
        return Object.keys(this.emojiSets);
    }

    // Get emoji set by name
    getEmojiSet(setName) {
        return this.emojiSets[setName] || this.emojiSets.animals;
    }

    // Get emojis for a specific set
    getEmojisForSet(setName) {
        const set = this.getEmojiSet(setName);
        return set ? set.emojis : this.emojiSets.animals.emojis;
    }

    // Set current emoji set
    setCurrentSet(setName) {
        if (this.emojiSets[setName]) {
            this.currentSet = setName;
            return true;
        }
        return false;
    }

    // Get current emoji set
    getCurrentSet() {
        return this.currentSet;
    }

    // Get current emojis
    getCurrentEmojis() {
        return this.getEmojisForSet(this.currentSet);
    }

    // Generate card pairs for a specific grid size
    generateCardPairs(gridSize, emojiSet = null) {
        const totalCards = gridSize * gridSize;
        const pairs = totalCards / 2;
        const set = emojiSet ? this.getEmojiSet(emojiSet) : this.getEmojiSet(this.currentSet);
        const emojis = set.emojis;
        
        if (pairs > emojis.length) {
            console.warn(`Not enough emojis in set. Need ${pairs}, have ${emojis.length}`);
            // Repeat emojis if needed
            const repeatedEmojis = [];
            for (let i = 0; i < pairs; i++) {
                repeatedEmojis.push(emojis[i % emojis.length]);
            }
            return repeatedEmojis;
        }
        
        // Select random emojis for the pairs
        const selectedEmojis = this.shuffleArray([...emojis]).slice(0, pairs);
        return selectedEmojis;
    }

    // Create card pairs with IDs
    createCardPairs(gridSize, emojiSet = null) {
        const emojis = this.generateCardPairs(gridSize, emojiSet);
        const totalCards = gridSize * gridSize;
        const pairs = totalCards / 2;
        
        const cardPairs = [];
        
        // Create pairs
        for (let i = 0; i < pairs; i++) {
            const emoji = emojis[i];
            const pairId = i;
            
            // Create two cards for each pair
            cardPairs.push({
                emoji: emoji,
                pairId: pairId,
                id: i * 2
            });
            
            cardPairs.push({
                emoji: emoji,
                pairId: pairId,
                id: i * 2 + 1
            });
        }
        
        return cardPairs;
    }

    // Shuffle array using Fisher-Yates algorithm
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Validate emoji set
    isValidEmojiSet(setName) {
        return this.emojiSets.hasOwnProperty(setName);
    }

    // Get set information
    getSetInfo(setName) {
        const set = this.getEmojiSet(setName);
        return {
            name: set.name,
            description: set.description,
            emojiCount: set.emojis.length,
            emojis: set.emojis
        };
    }

    // Check if emoji is valid (basic validation)
    isValidEmoji(emoji) {
        return typeof emoji === 'string' && emoji.length > 0;
    }

    // Get random emoji from current set
    getRandomEmoji(setName = null) {
        const emojis = setName ? this.getEmojisForSet(setName) : this.getCurrentEmojis();
        const randomIndex = Math.floor(Math.random() * emojis.length);
        return emojis[randomIndex];
    }

    // Get emoji by index
    getEmojiByIndex(index, setName = null) {
        const emojis = setName ? this.getEmojisForSet(setName) : this.getCurrentEmojis();
        return emojis[index] || null;
    }

    // Search emojis by keyword
    searchEmojis(keyword, setName = null) {
        const emojis = setName ? this.getEmojisForSet(setName) : this.getCurrentEmojis();
        // This is a simple search - in a real implementation, you might want more sophisticated matching
        return emojis.filter(emoji => emoji.includes(keyword));
    }

    // Get statistics for emoji sets
    getSetStatistics() {
        const stats = {};
        for (const [setName, set] of Object.entries(this.emojiSets)) {
            stats[setName] = {
                name: set.name,
                emojiCount: set.emojis.length,
                description: set.description
            };
        }
        return stats;
    }

    // Add custom emoji set (for future extensibility)
    addCustomSet(name, emojis, description = '') {
        if (this.emojiSets[name]) {
            console.warn(`Emoji set '${name}' already exists. Overwriting...`);
        }
        
        this.emojiSets[name] = {
            name: name,
            emojis: emojis,
            description: description
        };
        
        return true;
    }

    // Remove custom emoji set
    removeCustomSet(name) {
        if (this.emojiSets[name] && !['animals', 'food', 'objects', 'seasonal'].includes(name)) {
            delete this.emojiSets[name];
            return true;
        }
        return false;
    }
}
