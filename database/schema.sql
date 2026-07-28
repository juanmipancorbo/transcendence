CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT,
	account_host TEXT NOT NULL DEFAULT 'local',
    avatar_url TEXT DEFAULT NULL,
    bio VARCHAR(160) NOT NULL DEFAULT '',
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
	ALTER TABLE users
		ADD COLUMN IF NOT EXISTS bio VARCHAR(160) NOT NULL DEFAULT '';
END $$;

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
-- Count every completed game for both players and clear their current_game.
-- For a ranked game with a winner: award the winner 85 + (2 * moves they made) xp,
-- bump games_won/games_lost and return the winner's new xp.
-- Friendly games and draws skip ranked xp/win/loss updates and return NULL.
-- Locking the game row makes repeated or concurrent finish reports harmless.
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
	finished      TIMESTAMPTZ;
BEGIN
	SELECT white_player_id, black_player_id, friendly, moves, finished_at
		INTO white_id, black_id, is_friendly, game_moves, finished
		FROM games
		WHERE id = game_id
		FOR UPDATE;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'game % not found', game_id;
	END IF;
	IF finished IS NOT NULL THEN
		RETURN NULL;
	END IF;

	UPDATE games
		SET winner_id = winner, finished_at = CURRENT_TIMESTAMP
		WHERE id = game_id;
	UPDATE users
		SET current_game = NULL,
		    games_played = games_played + 1
		WHERE id IN (white_id, black_id);

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

-- Friends: unique unordered pairs of users.
-- The pair is stored canonically with user1_id < user2_id (see the trigger
-- below) so that a friendship between A and B is represented by a single row
-- regardless of which side it was created from. The CHECK + PRIMARY KEY
-- guarantee that canonical ordering and uniqueness hold even for direct inserts.
CREATE TABLE IF NOT EXISTS friends (
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1_id, user2_id),
    CONSTRAINT friends_no_self CHECK (user1_id <> user2_id),
    CONSTRAINT friends_ordered CHECK (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user2_id ON friends(user2_id);

-- Sort the ids before insert/update so user1_id is always smaller than
-- user2_id, avoiding logically duplicate rows (A,B) and (B,A).
CREATE OR REPLACE FUNCTION trg_order_friends()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.user1_id > NEW.user2_id THEN
		SELECT NEW.user2_id, NEW.user1_id INTO NEW.user1_id, NEW.user2_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friends_order ON friends;
CREATE TRIGGER friends_order
BEFORE INSERT OR UPDATE ON friends
FOR EACH ROW
EXECUTE FUNCTION trg_order_friends();

-- Look up whether two users are friends, regardless of argument order.
CREATE OR REPLACE FUNCTION are_friends(a UUID, b UUID)
RETURNS BOOLEAN AS $$
	SELECT EXISTS (
		SELECT 1 FROM friends
		WHERE user1_id = LEAST(a, b)
		  AND user2_id = GREATEST(a, b)
	);
$$ LANGUAGE sql STABLE;

-- Pending friend requests. Directional: sender_id asked receiver_id to be
-- friends. No ordering trigger here since direction is meaningful.
CREATE TABLE IF NOT EXISTS friend_requests (
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sender_id, receiver_id),
    CONSTRAINT friend_requests_no_self CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);

-- Chats: one row per 1-to-1 conversation (unordered pair of users).
-- The pair is stored canonically with person1_id < person2_id (see the trigger
-- below) so a conversation between A and B is a single row regardless of which
-- side opened it. Unlike friends, chats carry their own id so messages can
-- reference the conversation directly. The CHECK + UNIQUE guarantee canonical
-- ordering and uniqueness even for direct inserts.
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chats_no_self CHECK (person1_id <> person2_id),
    CONSTRAINT chats_ordered CHECK (person1_id < person2_id),
    CONSTRAINT chats_unique_pair UNIQUE (person1_id, person2_id)
);

-- Sort the ids before insert/update so person1_id is always smaller than
-- person2_id, avoiding logically duplicate rows (A,B) and (B,A).
CREATE OR REPLACE FUNCTION trg_order_chat()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.person1_id > NEW.person2_id THEN
		SELECT NEW.person2_id, NEW.person1_id INTO NEW.person1_id, NEW.person2_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chats_order ON chats;
CREATE TRIGGER chats_order
BEFORE INSERT OR UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION trg_order_chat();

-- Fetch the chat between two users, creating it on first contact. Returns the
-- chat id regardless of argument order. Handy for the websocket layer, which
-- needs a chat id before it can store an incoming message.
CREATE OR REPLACE FUNCTION get_or_create_chat(a UUID, b UUID)
RETURNS UUID AS $$
DECLARE chat_id UUID;
BEGIN
	SELECT id INTO chat_id FROM chats
		WHERE person1_id = LEAST(a, b) AND person2_id = GREATEST(a, b);
	IF chat_id IS NULL THEN
		INSERT INTO chats (person1_id, person2_id)
			VALUES (LEAST(a, b), GREATEST(a, b))
			ON CONFLICT (person1_id, person2_id) DO NOTHING
			RETURNING id INTO chat_id;
		-- Lost the race to a concurrent insert: read the row the other tx made.
		IF chat_id IS NULL THEN
			SELECT id INTO chat_id FROM chats
				WHERE person1_id = LEAST(a, b) AND person2_id = GREATEST(a, b);
		END IF;
	END IF;
	RETURN chat_id;
END;
$$ LANGUAGE plpgsql;

-- Eagerly create the (empty) chat between two users the moment they become
-- friends, so a missing chat row can safely mean "these users were never
-- friends" (e.g. for the chat history endpoint to reject on), instead of
-- needing a separate friends lookup.
CREATE OR REPLACE FUNCTION trg_create_chat_on_friendship()
RETURNS TRIGGER AS $$
BEGIN
	PERFORM get_or_create_chat(NEW.user1_id, NEW.user2_id);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friends_create_chat ON friends;
CREATE TRIGGER friends_create_chat
AFTER INSERT ON friends
FOR EACH ROW
EXECUTE FUNCTION trg_create_chat_on_friendship();

-- Messages belonging to a chat. Directional via sender_id; the receiver is the
-- other member of the chat. Deleting a chat (or either user) cascades here.
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Paginating a conversation walks messages of one chat newest-first.
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(chat_id, sender_id) WHERE read_at IS NULL;

-- Store a message from sender to receiver in a single round-trip: resolve (or
-- create) their chat, insert the message, and return the stored row. Lets the
-- backend send a message with one query instead of three.
CREATE OR REPLACE FUNCTION send_message(sender UUID, receiver UUID, body TEXT)
RETURNS messages AS $$
DECLARE
	chat_id UUID;
	msg     messages;
BEGIN
	chat_id := get_or_create_chat(sender, receiver);
	INSERT INTO messages (chat_id, sender_id, content)
		VALUES (chat_id, sender, body)
		RETURNING * INTO msg;
	RETURN msg;
END;
$$ LANGUAGE plpgsql;
