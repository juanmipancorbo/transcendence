CREATE TYPE game_status AS ENUM ('waiting', 'finished', 'active', 'abandoned');

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID NOT NULL,
    black_player_id UUID NOT NULL,
    board_state TEXT DEFAULT NULL,
    current_turn VARCHAR(10) NOT NULL,
    game_state game_status DEFAULT 'waiting',
    winner_id UUID DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);