/**
 * Woodraska Cribbage - Game Logic and Scoring Engine
 * Handles card dealing, scoring calculations, game rules enforcement, and win condition checking
 */

class CribbageLogic {
    constructor() {
        this.suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.cardValues = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 10, 'Q': 10, 'K': 10
        };
    }

    /**
     * Create a standard deck of 52 cards
     */
    createDeck() {
        const deck = [];
        for (const suit of this.suits) {
            for (const value of this.values) {
                deck.push({
                    id: `${suit}_${value}`,
                    suit: suit,
                    value: value,
                    playValue: this.cardValues[value]
                });
            }
        }
        return this.shuffleDeck(deck);
    }

    /**
     * Shuffle deck using Fisher-Yates algorithm
     */
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Deal cards to players
     */
    dealCards() {
        const deck = this.createDeck();
        const player1Hand = deck.slice(0, 6);
        const player2Hand = deck.slice(6, 12);
        const cutCard = deck[12];
        const remainingDeck = deck.slice(13);

        return {
            player1Hand,
            player2Hand,
            cutCard,
            remainingDeck
        };
    }

    /**
     * Calculate score for a hand of cards
     */
    calculateHandScore(cards, isCrib = false) {
        if (!cards || cards.length === 0) return 0;

        let score = 0;
        
        // Convert cards to scoring format
        const scoringCards = cards.map(card => ({
            suit: card.suit,
            value: card.value,
            playValue: this.cardValues[card.value]
        }));

        // Count different scoring combinations
        score += this.countFifteens(scoringCards);
        score += this.countPairs(scoringCards);
        score += this.countRuns(scoringCards);
        score += this.countFlushes(scoringCards, isCrib);
        score += this.countNobs(scoringCards);

        return score;
    }

    /**
     * Count 15s (combinations that add up to 15)
     */
    countFifteens(cards) {
        let score = 0;
        const combinations = this.getAllCombinations(cards);
        
        for (const combo of combinations) {
            if (combo.length >= 2) {
                const total = combo.reduce((sum, card) => sum + card.playValue, 0);
                if (total === 15) {
                    score += 2;
                }
            }
        }
        
        return score;
    }

    /**
     * Count pairs (2, 3, or 4 of a kind)
     */
    countPairs(cards) {
        let score = 0;
        const valueCounts = {};
        
        // Count occurrences of each value
        for (const card of cards) {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        }
        
        // Score pairs
        for (const count of Object.values(valueCounts)) {
            if (count >= 2) {
                score += this.getPairScore(count);
            }
        }
        
        return score;
    }

    /**
     * Get score for pairs
     */
    getPairScore(count) {
        switch (count) {
            case 2: return 2;  // One pair
            case 3: return 6;   // Three of a kind
            case 4: return 12;  // Four of a kind
            default: return 0;
        }
    }

    /**
     * Count runs (3+ consecutive cards)
     */
    countRuns(cards) {
        let score = 0;
        const valueCounts = {};
        
        // Count occurrences of each value
        for (const card of cards) {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        }
        
        // Find runs
        const values = Object.keys(valueCounts).sort((a, b) => this.getValueOrder(a) - this.getValueOrder(b));
        let runLength = 0;
        let runMultiplier = 1;
        
        for (let i = 0; i < values.length; i++) {
            const currentValue = values[i];
            const nextValue = values[i + 1];
            
            if (nextValue && this.getValueOrder(nextValue) === this.getValueOrder(currentValue) + 1) {
                runLength++;
                runMultiplier *= valueCounts[currentValue];
            } else {
                if (runLength >= 2) {
                    runMultiplier *= valueCounts[currentValue];
                    score += runLength * runMultiplier;
                }
                runLength = 0;
                runMultiplier = 1;
            }
        }
        
        return score;
    }

    /**
     * Count flushes (4+ cards of same suit)
     */
    countFlushes(cards, isCrib = false) {
        const suitCounts = {};
        
        // Count cards by suit
        for (const card of cards) {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        }
        
        // Find flush
        for (const count of Object.values(suitCounts)) {
            if (count >= 4) {
                return isCrib ? count : count;
            }
        }
        
        return 0;
    }

    /**
     * Count nobs (Jack of same suit as cut card)
     */
    countNobs(cards) {
        // This would need the cut card to be passed in
        // For now, return 0 as we don't have cut card context
        return 0;
    }

    /**
     * Get all combinations of cards
     */
    getAllCombinations(cards) {
        const combinations = [];
        
        for (let i = 0; i < Math.pow(2, cards.length); i++) {
            const combo = [];
            for (let j = 0; j < cards.length; j++) {
                if (i & (1 << j)) {
                    combo.push(cards[j]);
                }
            }
            if (combo.length >= 2) {
                combinations.push(combo);
            }
        }
        
        return combinations;
    }

    /**
     * Get value order for sorting
     */
    getValueOrder(value) {
        const order = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13
        };
        return order[value] || 0;
    }

    /**
     * Calculate score for played cards during play phase
     */
    calculatePlayScore(playedCards) {
        if (playedCards.length === 0) return 0;
        
        let score = 0;
        const lastCard = playedCards[playedCards.length - 1];
        const total = playedCards.reduce((sum, card) => sum + card.playValue, 0);
        
        // Score for 15
        if (total === 15) {
            score += 2;
        }
        
        // Score for 31
        if (total === 31) {
            score += 2;
        }
        
        // Score for pairs
        if (playedCards.length >= 2) {
            const lastTwo = playedCards.slice(-2);
            if (lastTwo[0].value === lastTwo[1].value) {
                score += 2;
            }
        }
        
        // Score for three of a kind
        if (playedCards.length >= 3) {
            const lastThree = playedCards.slice(-3);
            if (lastThree[0].value === lastThree[1].value && 
                lastThree[1].value === lastThree[2].value) {
                score += 6;
            }
        }
        
        // Score for four of a kind
        if (playedCards.length >= 4) {
            const lastFour = playedCards.slice(-4);
            if (lastFour[0].value === lastFour[1].value && 
                lastFour[1].value === lastFour[2].value &&
                lastFour[2].value === lastFour[3].value) {
                score += 12;
            }
        }
        
        // Score for runs
        if (playedCards.length >= 3) {
            const runScore = this.calculateRunScore(playedCards);
            score += runScore;
        }
        
        return score;
    }

    /**
     * Calculate run score for played cards
     */
    calculateRunScore(playedCards) {
        if (playedCards.length < 3) return 0;
        
        // Check runs starting from the end
        for (let length = Math.min(playedCards.length, 7); length >= 3; length--) {
            const lastCards = playedCards.slice(-length);
            if (this.isRun(lastCards)) {
                return length;
            }
        }
        
        return 0;
    }

    /**
     * Check if cards form a run
     */
    isRun(cards) {
        if (cards.length < 3) return false;
        
        const sortedCards = [...cards].sort((a, b) => this.getValueOrder(a.value) - this.getValueOrder(b.value));
        
        for (let i = 1; i < sortedCards.length; i++) {
            if (this.getValueOrder(sortedCards[i].value) !== this.getValueOrder(sortedCards[i-1].value) + 1) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if a card can be played
     */
    canPlayCard(card, currentTotal) {
        return (currentTotal + card.playValue) <= 31;
    }

    /**
     * Get playable cards from hand
     */
    getPlayableCards(hand, currentTotal) {
        return hand.filter(card => this.canPlayCard(card, currentTotal));
    }

    /**
     * Check if game is over
     */
    isGameOver(player1Score, player2Score) {
        return player1Score >= 121 || player2Score >= 121;
    }

    /**
     * Get winner
     */
    getWinner(player1Score, player2Score) {
        if (player1Score >= 121) return 'player1';
        if (player2Score >= 121) return 'player2';
        return null;
    }

    /**
     * Calculate final score difference
     */
    getFinalScoreDifference(player1Score, player2Score) {
        const winner = this.getWinner(player1Score, player2Score);
        if (winner === 'player1') {
            return player1Score - player2Score;
        } else if (winner === 'player2') {
            return player2Score - player1Score;
        }
        return 0;
    }

    /**
     * Validate game move
     */
    validateMove(move, gameState) {
        const errors = [];
        
        if (!move.playerEmail) {
            errors.push('Player email is required');
        }
        
        if (!move.action) {
            errors.push('Action is required');
        }
        
        if (gameState.currentPlayer !== move.playerEmail) {
            errors.push('Not your turn');
        }
        
        switch (move.action) {
            case 'play-card':
                if (!move.cardId) {
                    errors.push('Card ID is required');
                }
                break;
            case 'discard':
                if (!move.cardIds || move.cardIds.length !== 2) {
                    errors.push('Exactly 2 cards must be discarded');
                }
                break;
        }
        
        return errors;
    }

    /**
     * Get game statistics
     */
    getGameStatistics(gameState) {
        return {
            totalCardsPlayed: gameState.playedCards.length,
            currentTotal: gameState.currentTotal,
            player1Score: gameState.player1Score,
            player2Score: gameState.player2Score,
            currentPhase: gameState.currentPhase,
            gameStatus: gameState.gameStatus
        };
    }

    /**
     * Get scoring explanation for a hand
     */
    getScoringExplanation(cards) {
        const explanations = [];
        let totalScore = 0;
        
        // Check for 15s
        const fifteens = this.countFifteens(cards);
        if (fifteens > 0) {
            explanations.push(`${fifteens} points for 15s`);
            totalScore += fifteens;
        }
        
        // Check for pairs
        const pairs = this.countPairs(cards);
        if (pairs > 0) {
            explanations.push(`${pairs} points for pairs`);
            totalScore += pairs;
        }
        
        // Check for runs
        const runs = this.countRuns(cards);
        if (runs > 0) {
            explanations.push(`${runs} points for runs`);
            totalScore += runs;
        }
        
        // Check for flushes
        const flushes = this.countFlushes(cards);
        if (flushes > 0) {
            explanations.push(`${flushes} points for flush`);
            totalScore += flushes;
        }
        
        return {
            explanations,
            totalScore
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CribbageLogic;
}
