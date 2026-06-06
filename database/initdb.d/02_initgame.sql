--- CREATE TYPE WRAPPER - EXCEPTION HANDLER
DO $$ BEGIN
    CREATE TYPE game_status AS ENUM ('waiting', 'finished', 'active', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY NOT NULL,
    white_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    black_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id UUID DEFAULT NULL
);
