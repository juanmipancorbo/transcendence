import { pool } from "@utils/pg-pool"
import { sql } from "@utils/sql"
import { PublicUser, User } from "@endpoints/users-response" 

// Testing Query DELETE in prod
export async function selectUser(username: string): Promise<User | null>{
  const res = await pool.query(sql`
    SELECT * FROM users
    WHERE username = $1;
  `, [username]);
  return (res.rows[0] ?? null)
}

// Testing Query DELETE in prod
export async function selectUserTable(): Promise< User[] | null >{
  const res = await pool.query(sql`
    SELECT * FROM users`);
  return (res.rows ?? null);
}

export async function selectPublicUser(userId: string): Promise<PublicUser | null>
{
  const res = await pool.query(sql`
    SELECT id, username, email
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

export async function updateUserGameNull(userId: string)
{
  await pool.query(sql`
    UPDATE users
      SET current_game = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId]);
}