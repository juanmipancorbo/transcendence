import { pool } from "@utils/pg-pool"
import { sql } from "@utils/sql"
import { PublicUser, FullUser } from "@endpoints/users-response" 
import { FullGame } from "@endpoints/game-request";

const PROFILE_DATA = `
  id,
  username,
  email,
  avatar_url AS "avatarUrl",
  bio,
  current_game AS "currentGame",
  games_played AS "gamesPlayed",
  games_won AS "gamesWon",
  games_lost AS "gamesLost",
  xp,
  level
`;

// TEST Query DELETE in prod
export async function selectUserTable(): Promise<FullUser[] | null> {
  const res = await pool.query(sql`
    SELECT * FROM users`);
  return (res.rows ? res.rows.map(d => {return { status: "offline", ...d }}) : null);
}

export async function updateUsername(userId: string, newUsername: string): Promise<boolean> {
	const res = await pool.query(sql`
		UPDATE users SET username = $1 WHERE id = $2
	`, [newUsername, userId]);
	return res.rowCount != 0;
}

export async function updateBio(userId: string, bio: string): Promise<boolean> {
	const res = await pool.query(sql`
		UPDATE users SET bio = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, [bio, userId]);
	return res.rowCount != 0;
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<string> {
	const res = await pool.query(sql`
		UPDATE users
		SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
		RETURNING avatar_url
	`, [avatarUrl, userId]);

	if (res.rowCount === 0 || !res.rows[0]?.avatar_url) {
		throw new Error("User not found");
	}

	return res.rows[0].avatar_url;
}

export async function selectProfile(userId: string): Promise<PublicUser | null>
{
  const res = await pool.query(sql`
    SELECT ${PROFILE_DATA}
      FROM users
    WHERE id = $1
  `, [userId])
  return (res.rows[0] ? { ...res.rows[0], status: "offline" } : null)
}

export async function updateUserGame(userId: string, gameId: string | null)
{
  await pool.query(sql`
    UPDATE users
      SET current_game = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId, gameId]);
}

export async function getUserCurrentGame(userId: string): Promise<string | null> {
	const res = await pool.query(sql`
		SELECT current_game FROM users WHERE id = $1
	`, [userId]);
	return res.rows[0]?.current_game ?? null;
}

export async function getMatchHistory(userId: string, limit: number, before: Date): Promise<FullGame[]> {
	const sanitized = Math.min(Math.max(Math.trunc(limit), 1), 100);
	const res = await pool.query(sql`
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.time_left_white,
			g.time_left_black,
			g.friendly,
			g.allow_spectators,
			g.winner_id,
			g.created_at,
			g.finished_at,
			COALESCE(
				(SELECT json_agg(
					json_build_object('row', m.row, 'col', m.col, 'player', m.player)
					ORDER BY ord
				)
				FROM unnest(g.moves) WITH ORDINALITY AS m(row, col, player, ord)),
				'[]'
			) AS moves
		FROM games g
		WHERE $1 IN (g.black_player_id, g.white_player_id)
			AND g.created_at < $3
		ORDER BY g.created_at DESC
		LIMIT $2
	`, [userId, sanitized, before]);

	return res.rows;
}

export async function getPublicMatchHistory(userId: string, limit: number, before: Date): Promise<FullGame[]> {
	const sanitized = Math.min(Math.max(Math.trunc(limit), 1), 100);
	const res = await pool.query(sql`
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.time_left_white,
			g.time_left_black,
			g.friendly,
			g.allow_spectators,
			g.winner_id,
			g.created_at,
			g.finished_at,
			COALESCE(
				(SELECT json_agg(
					json_build_object('row', m.row, 'col', m.col, 'player', m.player)
					ORDER BY ord
				)
				FROM unnest(g.moves) WITH ORDINALITY AS m(row, col, player, ord)),
				'[]'
			) AS moves
		FROM games g
		WHERE $1 IN (g.black_player_id, g.white_player_id)
			AND g.allow_spectators AND g.created_at < $3
		ORDER BY g.created_at DESC
		LIMIT $2
	`, [userId, sanitized, before]);

	return res.rows;
}
