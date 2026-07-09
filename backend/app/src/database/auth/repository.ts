import { AuthUser, FullUser } from "@endpoints/users-response";
import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";

const USER_DATA = `
  id,
  username,
  email,
  avatar_url AS "avatarUrl",
  current_game AS "currentGame",
  games_played AS "gamesPlayed",
  games_won AS "gamesWon",
  games_lost AS "gamesLost",
  xp,
  level,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function insertUser(email: string, username: string, password: string)
{
  await pool.query(sql`
    INSERT INTO users (email, username, password_hash, account_host)
      VALUES ($1, $2, $3, 'local')
  `, [email, username, password]);
}

export async function insertUserGoogle(email: string, username: string): Promise<FullUser>
{
  const ret = await pool.query(sql`
    INSERT INTO users (email, username, account_host)
      VALUES ($1, $2, 'google')
      RETURNING ${USER_DATA}
  `, [email, username]);
  return ({ ...ret.rows[0], status: "offline" });
}

export async function selectAuthUser(email: string): Promise<AuthUser | null>
{
  const ret = await pool.query(sql`
    SELECT id, username, email, password_hash FROM users
      WHERE email = $1
  `, [email]);
  return (ret.rows[0] ?? null);
}

export async function selectUserById(id: string): Promise<AuthUser | null>
{
  const ret = await pool.query(sql`
    SELECT id, username, email, password_hash FROM users
      WHERE id = $1
  `, [id]);
  return (ret.rows[0] ?? null);
}

export async function selectFullUserById(id: string): Promise<FullUser | null>
{
  const ret = await pool.query(sql`
    SELECT ${USER_DATA} FROM users
      WHERE id = $1
  `, [id]);
  return (ret.rows[0] ? { ...ret.rows[0], status: "offline" } : null);
}

export async function selectFullUserByEmail(email: string): Promise<FullUser | null>
{
  const ret = await pool.query(sql`
    SELECT ${USER_DATA} FROM users
      WHERE email = $1
  `, [email]);
  return (ret.rows[0] ? { ...ret.rows[0], status: "offline" } : null);
}

export async function selectUserByUsername(username: string): Promise<AuthUser | null>
{
  const ret = await pool.query(sql`
    SELECT id, username, email, password_hash FROM users
      WHERE username = $1
  `, [username]);
  return (ret.rows[0] ?? null);
}

export async function saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>
{
  await pool.query(sql`
    INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3)
  `, [userId, tokenHash, expiresAt]);
}

export async function deleteRefreshToken(userId: string, tokenHash: string): Promise<void>
{
  await pool.query(sql`
    DELETE FROM auth_sessions WHERE user_id = $1 AND refresh_token_hash = $2
  `, [userId, tokenHash]);
}

export async function deleteAllUserSessions(userId: string): Promise<void>
{
  await pool.query(sql`
    DELETE FROM auth_sessions WHERE user_id = $1
  `, [userId]);
}

export async function findRefreshToken(userId: string, tokenHash: string): Promise<boolean>
{
  const ret = await pool.query(sql`
    SELECT 1 FROM auth_sessions 
      WHERE user_id = $1 AND refresh_token_hash = $2 AND expires_at > NOW()
  `, [userId, tokenHash]);
  return ret.rows.length > 0;
}
