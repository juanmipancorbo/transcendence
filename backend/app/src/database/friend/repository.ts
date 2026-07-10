import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";
import { PublicUser } from "@endpoints/users-response";

const FRIEND_DATA = `
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

export async function insertFriendRequest(senderId: string, receiverId: string): Promise<void> {
	await pool.query(sql`
		INSERT INTO friend_requests (sender_id, receiver_id)
		VALUES ($1, $2)
	`, [senderId, receiverId]);
}

export async function deleteFriendRequest(senderId: string, receiverId: string): Promise<void> {
	await pool.query(sql`
		DELETE FROM friend_requests
		WHERE sender_id = $1 AND receiver_id = $2
	`, [senderId, receiverId]);
}

export async function selectFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
	const res = await pool.query(sql`
		SELECT 1 FROM friend_requests
		WHERE sender_id = $1 AND receiver_id = $2
	`, [senderId, receiverId]);
	return (res.rows.length > 0);
}

export async function selectIncomingRequests(userId: string): Promise<PublicUser[]> {
	const res = await pool.query(sql`
		SELECT ${FRIEND_DATA}
		FROM friend_requests fr
		JOIN users u ON u.id = fr.sender_id
		WHERE fr.receiver_id = $1
		ORDER BY fr.created_at DESC
	`, [userId]);
	return res.rows.map(d => {return { status: "offline", ...d }});
}

export async function selectOutgoingRequests(userId: string): Promise<PublicUser[]> {
	const res = await pool.query(sql`
		SELECT ${FRIEND_DATA}
		FROM friend_requests fr
		JOIN users u ON u.id = fr.receiver_id
		WHERE fr.sender_id = $1
		ORDER BY fr.created_at DESC
	`, [userId]);
	return res.rows.map(d => {return { status: "offline", ...d }});
}

export async function insertFriend(userId: string, friendId: string): Promise<void> {
	await pool.query(sql`
		INSERT INTO friends (user1_id, user2_id)
		VALUES ($1, $2)
	`, [userId, friendId]);
}

export async function deleteFriend(userId: string, friendId: string): Promise<void> {
	await pool.query(sql`
		DELETE FROM friends
		WHERE user1_id = LEAST($1::uuid, $2::uuid)
		AND user2_id = GREATEST($1::uuid, $2::uuid)
	`, [userId, friendId]);
}

export async function selectAreFriends(userId: string, friendId: string): Promise<boolean> {
	const res = await pool.query(sql`
		SELECT are_friends($1, $2) AS "areFriends"
	`, [userId, friendId]);
	return (res.rows[0]?.areFriends ?? false);
}

// Just the ids of every friend of userId.
export async function selectFriends(userId: string): Promise<string[]> {
	const res = await pool.query(sql`
		SELECT CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END AS id
		FROM friends f
		WHERE f.user1_id = $1 OR f.user2_id = $1
	`, [userId]);
	return (res.rows.map((row) => row.id));
}

// PublicUser profile of every friend of userId.
export async function selectFriendProfiles(userId: string): Promise<PublicUser[]> {
	const res = await pool.query(sql`
		SELECT ${FRIEND_DATA}
		FROM friends f
		JOIN users u ON u.id = CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END
		WHERE f.user1_id = $1 OR f.user2_id = $1
		ORDER BY f.created_at DESC
	`, [userId]);
	return res.rows.map(d => {return { status: "offline", ...d }});
}

// Accept an incoming request atomically: drop the pending row and create the
// friendship in one transaction so we never end up with one without the other.
export async function acceptFriendRequest(senderId: string, receiverId: string): Promise<void> {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query(sql`
			DELETE FROM friend_requests
			WHERE sender_id = $1 AND receiver_id = $2
		`, [senderId, receiverId]);
		await client.query(sql`
			INSERT INTO friends (user1_id, user2_id)
			VALUES ($1, $2)
		`, [senderId, receiverId]);
		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}
