import { GameData } from "@endpoints/users-response";
import { pool } from "@utils/pg-pool"
import { sql } from "@utils/sql"

const GAME_DATA = "id, white_player_id, black_player_id, winner_id";

export async function insertGame(gameId: string, whiteId: string, blackId: string):
    Promise<void> {
  await pool.query(sql`
    INSERT INTO games (${GAME_DATA})
      VALUES ($1, $2, $3)
  `, [gameId, whiteId, blackId]);
}

export async function selectGame(gameId: string): Promise<GameData | null> {
  const ret = await pool.query<GameData>(sql`
    SELECT ${GAME_DATA} FROM games
      WHERE id = $1
  `, [gameId]);
  return (ret.rows[0] ?? null);
}

export async function updateWinner(gameId: string, winnerId: string):
    Promise<GameData | null> {
  const ret = await pool.query<GameData>(sql`
    UPDATE games
      SET winner_id = $2
      WHERE id = $1
    RETURNING ${GAME_DATA}
  `, [gameId, winnerId]);
  return (ret.rows[0] ?? null);
}