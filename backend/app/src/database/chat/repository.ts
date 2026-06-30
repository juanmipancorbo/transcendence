import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";
import { ChatMessage } from "@endpoints/chat-response";

const MESSAGE_DATA = `id, chat_id AS "chatId", sender_id AS "senderId", content, created_at AS "createdAt"`;

// Id of the chat between two users, or null if they never talked.
export async function selectChatId(a: string, b: string): Promise<string | null> {
	const res = await pool.query(sql`
		SELECT id FROM chats
		WHERE person1_id = LEAST($1::uuid, $2::uuid)
		  AND person2_id = GREATEST($1::uuid, $2::uuid)
	`, [a, b]);
	return (res.rows[0]?.id ?? null);
}

// Id of the chat between two users, creating it if it does not exist yet.
export async function selectOrCreateChat(a: string, b: string): Promise<string> {
	const res = await pool.query(sql`
		SELECT get_or_create_chat($1, $2) AS id
	`, [a, b]);
	return (res.rows[0].id);
}

// Store a message from sender to receiver and return the stored row (with its
// generated id and timestamp). The chat is created on first contact. All of it
// happens in a single query via the send_message() SQL function.
export async function insertMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
	const res = await pool.query(sql`
		SELECT m.id, m.chat_id AS "chatId", m.sender_id AS "senderId", m.content, m.created_at AS "createdAt"
		FROM send_message($1, $2, $3) AS m
	`, [senderId, receiverId, content]);
	return (res.rows[0]);
}

// One page of a conversation, newest message first. When `before` is given,
// only messages created strictly before it are returned (cursor pagination).
export async function selectChatHistory(chatId: string, limit: number, before?: Date): Promise<ChatMessage[]> {
	const res = await pool.query(sql`
		SELECT ${MESSAGE_DATA}
		FROM messages
		WHERE chat_id = $1
		  AND ($2::timestamp IS NULL OR created_at < $2::timestamp)
		ORDER BY created_at DESC
		LIMIT $3
	`, [chatId, before ?? null, limit]);
	return (res.rows);
}
