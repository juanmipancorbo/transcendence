import { AuthUser } from "@endpoints/users-response";
import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";

export async function insertUser(email: string, username: string, password: string)
{
  await pool.query(sql`
    INSERT INTO user (email, usernmae, password)
      VALUES ($1, $2, $3)
  `, [email, username, password]);
}

export async function selectAuthUser(email: string): Promise<AuthUser | null>
{
  const ret = await pool.query(sql`
    SELECT (id, username, email, password_hash) FROM users
      WHERE email = $1
  `, [email]);
  return (ret.rows[0] ?? null);
}