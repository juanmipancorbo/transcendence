import { pool } from "@utils/pg-pool"
import { sql } from "@utils/sql"
import { PublicUser, FullUser } from "@endpoints/users-response" 

const PROFILE_DATA = " id, username, email, avatarUrl, gamesPlayed, gamesWon, gamesLost, xp, level";

// TEST Query DELETE in prod
export async function selectUser(username: string): Promise<FullUser | null>{
  const res = await pool.query(sql`
    SELECT * FROM users
    WHERE username = $1;
  `, [username]);
  return (res.rows[0] ?? null)
}

// TEST Query DELETE in prod
export async function selectUserTable(): Promise<FullUser[] | null> {
  const res = await pool.query(sql`
    SELECT * FROM users`);
  return (res.rows ?? null);
}

export async function selectProfile(userId: string): Promise<PublicUser | null>
{
  const res = await pool.query(sql`
    SELECT ${PROFILE_DATA}
      FROM users
    WHERE id = $1
  `, [userId])
  return (res.rows[0] ?? null)
}

export async function updateUserGame(userId: string, gameId: string)
{
  await pool.query(sql`
    UPDATE users
      SET current_game = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId, gameId]);
}
