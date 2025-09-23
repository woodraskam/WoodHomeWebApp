-- Woodraska Cribbage Database Schema
-- SQLite database schema for cribbage game management

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player1_email TEXT NOT NULL,
    player2_email TEXT,
    status TEXT NOT NULL DEFAULT 'waiting',
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    current_phase TEXT DEFAULT 'waiting',
    current_player TEXT,
    game_data TEXT, -- JSON string for game state
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game tokens table for secure game access
CREATE TABLE IF NOT EXISTS game_tokens (
    token TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Game moves table for game history
CREATE TABLE IF NOT EXISTS game_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_email TEXT NOT NULL,
    move_type TEXT NOT NULL, -- 'play_card', 'discard', 'count', 'go'
    move_data TEXT, -- JSON string for move details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Game updates table for real-time updates
CREATE TABLE IF NOT EXISTS game_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    update_type TEXT NOT NULL, -- 'card_played', 'score_update', 'phase_change', 'game_end'
    update_data TEXT NOT NULL, -- JSON string for update details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_email);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_email);
CREATE INDEX IF NOT EXISTS idx_tokens_game_id ON game_tokens(game_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user_email ON game_tokens(user_email);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON game_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_player ON game_moves(player_email);
CREATE INDEX IF NOT EXISTS idx_updates_game_id ON game_updates(game_id);
CREATE INDEX IF NOT EXISTS idx_updates_type ON game_updates(update_type);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_games_updated_at 
    AFTER UPDATE ON games
    BEGIN
        UPDATE games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS active_games AS
SELECT 
    id,
    player1_email,
    player2_email,
    status,
    player1_score,
    player2_score,
    current_phase,
    current_player,
    created_at,
    updated_at
FROM games 
WHERE status IN ('waiting', 'active');

CREATE VIEW IF NOT EXISTS game_summary AS
SELECT 
    g.id,
    g.player1_email,
    g.player2_email,
    g.status,
    g.player1_score,
    g.player2_score,
    g.current_phase,
    g.current_player,
    g.created_at,
    g.updated_at,
    COUNT(m.id) as move_count,
    COUNT(u.id) as update_count
FROM games g
LEFT JOIN game_moves m ON g.id = m.game_id
LEFT JOIN game_updates u ON g.id = u.game_id
GROUP BY g.id;
