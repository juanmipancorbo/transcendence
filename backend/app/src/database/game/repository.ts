import { GameData } from "@endpoints/users-response";
import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";

export async function insertGame(gameId: string, whiteId: string, blackId: string, friendly: boolean, time: number, allowSpectators: boolean):
    Promise<void> {
  await pool.query(sql`
    INSERT INTO games (gameId, white_player_id, black_player_id, time_left_white, time_left_black, friendly, allow_spectators)
      VALUES ($1, $2, $3, $4, $5, $6)
  `, [gameId, whiteId, blackId, time, time, friendly, allowSpectators]);
}

export async function selectGame(gameId: string): Promise<GameData | null> {
  const ret = await pool.query<GameData>(sql`
    SELECT * FROM games
      WHERE id = $1
  `, [gameId]);
  return (ret.rows[0] ?? null);
}

// TEST Query DELETE in prod
export async function selectGameTable(): Promise<GameData[] | null> {
  const ret = await pool.query<GameData>(sql`
    SELECT * FROM games`);
  return (ret.rows ?? null);
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
  return res.rows[0] ?? null;
}
