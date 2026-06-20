CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    current_game UUID DEFAULT NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
	xp INT NOT NULL DEFAULT 0,
	level INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
	CREATE TYPE move AS (row smallint, col smallint, player smallint);
	EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY NOT NULL,
    white_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    black_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	time_left_white INT NOT NULL DEFAULT -1,
	time_left_black INT NOT NULL DEFAULT -1,
	friendly BOOLEAN NOT NULL DEFAULT FALSE,
	allow_spectators BOOLEAN NOT NULL DEFAULT FALSE,
	moves move[] NOT NULL DEFAULT '{}',
    winner_id UUID DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP DEFAULT NULL
);

-- Add the FK once both tables exist to fix dependency issue.
DO $$ BEGIN
	ALTER TABLE users
		ADD CONSTRAINT users_current_game_fkey
		FOREIGN KEY (current_game) REFERENCES games(id) ON DELETE SET NULL;
	EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Auth Sessions table for storing refresh tokens
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session_per_user UNIQUE(user_id, refresh_token_hash)
);

-- Index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- XP / Level system
-- BASE = 100, EXPONENT = 1.5
-- xpForLevel(n) = floor(BASE * (n ^ EXPONENT)) = total xp required to reach level n
CREATE OR REPLACE FUNCTION xp_for_level(n INTEGER)
RETURNS BIGINT AS $$
SELECT FLOOR(100 * (GREATEST(n, 0) ^ 1.5))::BIGINT;
$$ LANGUAGE sql IMMUTABLE;

-- level_from_xp(xp) = highest level n such that xpForLevel(n) <= xp
-- Uses the closed-form inverse ((xp/BASE)^(1/EXPONENT)) as a starting guess,
-- then corrects for floating point error and the floor() in xpForLevel.
CREATE OR REPLACE FUNCTION level_from_xp(xp_amount BIGINT)
RETURNS INTEGER AS $$
DECLARE lvl INTEGER;
BEGIN
	IF xp_amount < xp_for_level(1) THEN
		RETURN 0;
	END IF;

	lvl := FLOOR(POWER(xp_amount::numeric / 100, 2.0 / 3.0))::INTEGER;

	WHILE xp_for_level(lvl + 1) <= xp_amount LOOP
		lvl := lvl + 1;
	END LOOP;
	WHILE lvl > 0 AND xp_for_level(lvl) > xp_amount LOOP
		lvl := lvl - 1;
	END LOOP;

	RETURN lvl;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Keep users.level in sync whenever xp changes
CREATE OR REPLACE FUNCTION trg_update_level_from_xp()
RETURNS TRIGGER AS $$
BEGIN
NEW.level := level_from_xp(NEW.xp);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_update_level ON users;
CREATE TRIGGER users_update_level
BEFORE INSERT OR UPDATE OF xp ON users
FOR EACH ROW
EXECUTE FUNCTION trg_update_level_from_xp();

-- Report the outcome of a game.
-- Player numbers stored in moves[].player follow logic/game.ts: BLACK = 1, WHITE = 2.
-- For a ranked game with a winner: award the winner 85 + (2 * moves they made) xp,
-- bump games_won/games_lost, set winner_id and clear both players' current_game,
-- and return the winner's new xp.
-- For a friendly game (or a draw): only set winner_id and clear current_game,
-- skipping all xp/stat updates, and return NULL.
-- If anything goes wrong, return the winner's current (unchanged) xp instead of
-- raising.
CREATE OR REPLACE FUNCTION report_game(game_id UUID, winner UUID)
RETURNS INT AS $$
DECLARE
	white_id     UUID;
	black_id     UUID;
	is_friendly  BOOLEAN;
	game_moves   move[];
	loser        UUID;
	winner_moves INT;
	new_xp       INT;
BEGIN
	SELECT white_player_id, black_player_id, friendly, moves
		INTO white_id, black_id, is_friendly, game_moves
		FROM games
		WHERE id = game_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'game % not found', game_id;
	END IF;

	UPDATE games SET winner_id = winner WHERE id = game_id;
	UPDATE users SET current_game = NULL WHERE id IN (white_id, black_id);

	IF is_friendly OR winner IS NULL THEN
		RETURN NULL;
	END IF;

	IF winner = white_id THEN
		loser := black_id;
	ELSE
		loser := white_id;
	END IF;

	-- WHITE = 2, BLACK = 1
	SELECT count(*) INTO winner_moves
		FROM unnest(game_moves) AS m
		WHERE m.player = (CASE WHEN winner = white_id THEN 2 ELSE 1 END);

	UPDATE users
		SET xp = xp + 85 + (2 * winner_moves),
		    games_won = games_won + 1
		WHERE id = winner
		RETURNING xp INTO new_xp;

	UPDATE users
		SET games_lost = games_lost + 1
		WHERE id = loser;

	RETURN new_xp;
EXCEPTION WHEN OTHERS THEN
	RETURN (SELECT xp FROM users WHERE id = winner);
END;
$$ LANGUAGE plpgsql;

-- Append a movement to a game.
-- The player number is derived from user_id: BLACK = 1 (black_player_id),
-- WHITE = 2 (white_player_id), matching logic/game.ts. If the user is not a
-- player of the game, nothing is appended.
CREATE OR REPLACE FUNCTION add_game_movement(game_id UUID, user_id UUID, m_row SMALLINT, m_col SMALLINT)
RETURNS VOID AS $$
BEGIN
	UPDATE games
		SET moves = moves || ROW(
			m_row,
			m_col,
			CASE WHEN black_player_id = user_id THEN 1 ELSE 2 END
		)::move
		WHERE id = game_id
		  AND user_id IN (white_player_id, black_player_id);
END;
$$ LANGUAGE plpgsql;

-- Update the remaining time for a player in a game.
CREATE OR REPLACE FUNCTION update_time_left(game_id UUID, user_id UUID, time_left INT)
RETURNS VOID AS $$
BEGIN
	UPDATE games
		SET time_left_white = CASE WHEN white_player_id = user_id THEN time_left ELSE time_left_white END,
		    time_left_black = CASE WHEN black_player_id = user_id THEN time_left ELSE time_left_black END
		WHERE id = game_id
		  AND user_id IN (white_player_id, black_player_id);
END;
$$ LANGUAGE plpgsql;
