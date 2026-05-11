--- CREATE TYPE WRAPPER - EXCEPTION HANDLER
DO $$ BEGIN
    CREATE TYPE game_status AS ENUM ('waiting', 'finished', 'active', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    black_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_game UUID DEFAULT NULL REFERENCES games(id) ON DELETE SET NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0
);