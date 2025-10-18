// Memory Game - Player Management

class PlayerManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.playerColors = ['red', 'yellow', 'green', 'blue'];
        this.playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
    }

    setPlayerCount(count) {
        if (count < 1 || count > 4) {
            console.error('Invalid player count:', count);
            return false;
        }

        // Clear existing players
        this.gameState.players = [];

        // Create new players
        for (let i = 0; i < count; i++) {
            const player = new Player(
                this.playerNames[i],
                this.playerColors[i],
                false // Not AI by default
            );
            this.gameState.players.push(player);
        }

        // Reset current player to first player
        this.gameState.currentPlayer = 0;

        console.log(`Set player count to ${count}`);
        return true;
    }

    addPlayer(name, color, isAI = false) {
        if (this.gameState.players.length >= 4) {
            console.error('Maximum 4 players allowed');
            return false;
        }

        const player = new Player(name, color, isAI);
        this.gameState.players.push(player);
        return true;
    }

    removePlayer(playerIndex) {
        if (playerIndex < 0 || playerIndex >= this.gameState.players.length) {
            console.error('Invalid player index:', playerIndex);
            return false;
        }

        this.gameState.players.splice(playerIndex, 1);

        // Adjust current player index if necessary
        if (this.gameState.currentPlayer >= this.gameState.players.length) {
            this.gameState.currentPlayer = 0;
        }

        return true;
    }

    nextPlayer() {
        if (this.gameState.players.length === 0) {
            return;
        }

        this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
    }

    getCurrentPlayer() {
        if (this.gameState.players.length === 0) {
            return null;
        }
        return this.gameState.players[this.gameState.currentPlayer];
    }

    getPlayerByIndex(index) {
        if (index < 0 || index >= this.gameState.players.length) {
            return null;
        }
        return this.gameState.players[index];
    }

    getAllPlayers() {
        return [...this.gameState.players];
    }

    getPlayerStats() {
        return this.gameState.players.map(player => player.getStats());
    }

    resetAllPlayers() {
        this.gameState.players.forEach(player => {
            player.reset();
        });
    }

    setPlayerAI(playerIndex, isAI) {
        const player = this.getPlayerByIndex(playerIndex);
        if (player) {
            player.isAI = isAI;
            return true;
        }
        return false;
    }

    setPlayerName(playerIndex, name) {
        const player = this.getPlayerByIndex(playerIndex);
        if (player) {
            player.name = name;
            return true;
        }
        return false;
    }

    setPlayerColor(playerIndex, color) {
        const player = this.getPlayerByIndex(playerIndex);
        if (player) {
            player.color = color;
            return true;
        }
        return false;
    }

    getAvailableColors() {
        const usedColors = this.gameState.players.map(player => player.color);
        return this.playerColors.filter(color => !usedColors.includes(color));
    }

    getWinner() {
        if (this.gameState.players.length === 0) {
            return null;
        }

        let winner = this.gameState.players[0];
        for (let i = 1; i < this.gameState.players.length; i++) {
            if (this.gameState.players[i].score > winner.score) {
                winner = this.gameState.players[i];
            }
        }

        // Check for ties
        const tiedPlayers = this.gameState.players.filter(player => player.score === winner.score);
        if (tiedPlayers.length > 1) {
            return null; // Tie game
        }

        return winner;
    }

    getRankings() {
        return [...this.gameState.players].sort((a, b) => b.score - a.score);
    }

    // AI Player Management
    createAIPlayer(difficulty = 'medium') {
        const availableColors = this.getAvailableColors();
        if (availableColors.length === 0) {
            console.error('No available colors for AI player');
            return false;
        }

        const aiPlayer = new Player(
            `AI Player ${this.gameState.players.length + 1}`,
            availableColors[0],
            true
        );

        // Set AI difficulty
        aiPlayer.difficulty = difficulty;
        aiPlayer.memory = []; // AI memory for card positions

        this.gameState.players.push(aiPlayer);
        return true;
    }

    removeAIPlayers() {
        this.gameState.players = this.gameState.players.filter(player => !player.isAI);
    }

    getAIPlayers() {
        return this.gameState.players.filter(player => player.isAI);
    }

    getHumanPlayers() {
        return this.gameState.players.filter(player => !player.isAI);
    }

    // Player validation
    validatePlayerSetup() {
        if (this.gameState.players.length === 0) {
            return { valid: false, error: 'No players configured' };
        }

        if (this.gameState.players.length > 4) {
            return { valid: false, error: 'Too many players (max 4)' };
        }

        // Check for duplicate names
        const names = this.gameState.players.map(player => player.name);
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            return { valid: false, error: 'Duplicate player names' };
        }

        // Check for duplicate colors
        const colors = this.gameState.players.map(player => player.color);
        const uniqueColors = new Set(colors);
        if (colors.length !== uniqueColors.size) {
            return { valid: false, error: 'Duplicate player colors' };
        }

        return { valid: true, error: null };
    }

    // Game state management
    resetGame() {
        this.resetAllPlayers();
        this.gameState.currentPlayer = 0;
    }

    startGame() {
        const validation = this.validatePlayerSetup();
        if (!validation.valid) {
            console.error('Invalid player setup:', validation.error);
            return false;
        }

        this.resetGame();
        return true;
    }

    // Statistics
    getGameStatistics() {
        const stats = {
            totalPlayers: this.gameState.players.length,
            humanPlayers: this.getHumanPlayers().length,
            aiPlayers: this.getAIPlayers().length,
            players: this.getPlayerStats(),
            rankings: this.getRankings()
        };

        return stats;
    }
}
