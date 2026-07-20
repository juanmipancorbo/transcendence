import { FullGame, GameData } from "@endpoints/game-request";
import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";

const GAME_DATA = `
	id as gameId,
	white_player_id as whiteId,
	black_player_id as blackId,
	time_left_white as timeLimitWhite,
	time_left_black as timeLimitBlack,
	allow_spectators as allowSpectators,
	friendly,
	winner_id as winnerId
`;

export async function insertGame(gameId: string, whiteId: string, blackId: string, friendly: boolean, time: number, allowSpectators: boolean):
    Promise<void> {
  await pool.query(sql`
    INSERT INTO games (id, white_player_id, black_player_id, time_left_white, time_left_black, friendly, allow_spectators)
      VALUES ($1, $2, $3, $4, $4, $5, $6)
  `, [gameId, whiteId, blackId, time, friendly, allowSpectators]);
}

export async function selectGame(gameId: string): Promise<GameData | null> {
  const ret = await pool.query<GameData>(sql`
    SELECT ${GAME_DATA} FROM games
      WHERE id = $1
  `, [gameId]);
  return (ret.rows[0] ?? null);
}

export async function updateUserTimer(gameId: string, userId: string, timeLeft: number) {
	await pool.query(sql`
		SELECT update_time_left($1, $2, $3)
	`, [gameId, userId, timeLeft]);
}

export async function addGameMovement(gameId: string, userId: string, row: number, col: number): Promise<void> {
	await pool.query(sql`
		SELECT add_game_movement($1, $2, $3, $4)
	`, [gameId, userId, row, col]);
}

export async function reportFinishedGame(gameId: string, winner: string | null): Promise<number | null>
{
  const res = await pool.query(sql`
	SELECT report_game($1, $2) as xp
  `, [gameId, winner]);
  return res.rows[0]?.xp ?? null;
}

export async function selectCompletedGame(gameId: string, userId: string): Promise<FullGame | null> {
	const res = await pool.query<FullGame>(sql`
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.winner_id,
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
		WHERE g.id = $1
			AND g.finished_at IS NOT NULL
			AND $2 IN (g.black_player_id, g.white_player_id)
	`, [gameId, userId]);
	return res.rows[0] ?? null;
}

export async function updateGameWinner(gameId: string, winnerId: string)
{
  await pool.query(sql`
    UPDATE games
      SET winner_id = $2, finished_at = CURRENT_TIMESTAMP
    WHERE id = $1
`, [gameId, winnerId]);
}

export async function getUnfinishedGames(): Promise<FullGame[]> {
	const res = await pool.query(sql`
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.allow_spectators,
			g.friendly,
			g.time_left_black,
			g.time_left_white,
		COALESCE(
			(SELECT json_agg(
				json_build_object('row', m.row, 'col', m.col, 'player', m.player)
				ORDER BY ord
			)
			FROM unnest(g.moves) WITH ORDINALITY AS m(row, col, player, ord)),
			'[]'
		) AS moves
		FROM games g
		WHERE g.finished_at IS NULL;
	`);
	return res.rows;
}
