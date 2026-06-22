import { pool } from "@utils/pg-pool"
import { sql } from "@utils/sql"
import { PublicUser, FullUser } from "@endpoints/users-response" 

const PROFILE_DATA = ` id, username, email, avatar_url AS "avatarUrl", games_played AS "gamesPlayed", games_won AS "gamesWon", games_lost AS "gamesLost", xp, level`;

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

export async function selectProfile(userId: string): Promise<PublicUser | null>
{
  const res = await pool.query(sql`
    SELECT ${PROFILE_DATA}
      FROM users
    WHERE id = $1
  `, [userId])
  return (res.rows[0] ? { ...res.rows[0], status: "offline" } : null)
}

export async function updateUserGame(userId: string, gameId: string)
{
  await pool.query(sql`
    UPDATE users
      SET current_game = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId, gameId]);
}
