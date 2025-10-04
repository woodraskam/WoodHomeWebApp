/**
 * Global State Manager with Undo/Redo Functionality
 * Manages application state with history tracking for undo/redo operations
 */
class StateManager {
    constructor() {
        this.state = {};
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.listeners = new Map();
        this.isUndoRedoOperation = false;
        this.init();
    }

    init() {
        this.loadState();
        this.setupKeyboardShortcuts();
        this.setupGlobalStateSync();
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('spa-global-state');
            if (savedState) {
                this.state = JSON.parse(savedState);
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
            this.state = {};
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('spa-global-state', JSON.stringify(this.state));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Set state with history tracking
     */
    setState(newState, description = 'State change') {
        if (this.isUndoRedoOperation) {
            return;
        }

        // Create a snapshot of current state
        const currentSnapshot = { ...this.state };

        // Add to history if state actually changed
        if (JSON.stringify(currentSnapshot) !== JSON.stringify(newState)) {
            // Remove any history after current index (when undoing and then making new changes)
            this.history = this.history.slice(0, this.historyIndex + 1);

            // Add current state to history
            this.history.push({
                state: currentSnapshot,
                timestamp: Date.now(),
                description
            });

            // Limit history size
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            } else {
                this.historyIndex++;
            }

            // Update current state
            this.state = { ...newState };
            this.saveState();
            this.notifyListeners();
        }
    }

    /**
     * Update specific state property
     */
    updateState(key, value, description = `Update ${key}`) {
        const newState = { ...this.state, [key]: value };
        this.setState(newState, description);
    }

    /**
     * Get specific state property
     */
    getStateProperty(key) {
        return this.state[key];
    }

    /**
     * Undo last state change
     */
    undo() {
        if (this.canUndo()) {
            this.isUndoRedoOperation = true;
            this.historyIndex--;
            const previousState = this.history[this.historyIndex];
            this.state = { ...previousState.state };
            this.saveState();
            this.notifyListeners();
            this.isUndoRedoOperation = false;
            return true;
        }
        return false;
    }

    /**
     * Redo next state change
     */
    redo() {
        if (this.canRedo()) {
            this.isUndoRedoOperation = true;
            this.historyIndex++;
            const nextState = this.history[this.historyIndex];
            this.state = { ...nextState.state };
            this.saveState();
            this.notifyListeners();
            this.isUndoRedoOperation = false;
            return true;
        }
        return false;
    }

    /**
     * Check if undo is possible
     */
    canUndo() {
        return this.historyIndex > 0;
    }

    /**
     * Check if redo is possible
     */
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Get undo/redo status
     */
    getUndoRedoStatus() {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            historySize: this.history.length,
            currentIndex: this.historyIndex
        };
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * Get history for debugging
     */
    getHistory() {
        return this.history.map((entry, index) => ({
            index,
            description: entry.description,
            timestamp: entry.timestamp,
            isCurrent: index === this.historyIndex
        }));
    }

    /**
     * Add state change listener
     */
    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    /**
     * Remove state change listener
     */
    removeListener(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify listeners of state changes
     */
    notifyListeners() {
        this.listeners.forEach((callbacks, key) => {
            callbacks.forEach(callback => {
                try {
                    callback(this.state, key);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        });
    }

    /**
     * Setup keyboard shortcuts for undo/redo
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                this.redo();
            }
        });
    }

    /**
     * Setup global state synchronization
     */
    setupGlobalStateSync() {
        // Sync with section-specific state managers
        window.addEventListener('storage', (e) => {
            if (e.key === 'spa-global-state') {
                this.loadState();
                this.notifyListeners();
            }
        });
    }

    /**
     * Create a state snapshot for external use
     */
    createSnapshot(description = 'Manual snapshot') {
        const snapshot = {
            state: { ...this.state },
            timestamp: Date.now(),
            description
        };
        return snapshot;
    }

    /**
     * Restore from snapshot
     */
    restoreFromSnapshot(snapshot, description = 'Restore from snapshot') {
        this.setState(snapshot.state, description);
    }
}

// Global state manager instance
window.stateManager = new StateManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
