import { UUID } from "node:crypto";

// A single message in a 1-to-1 chat, as returned by the chat history endpoint.
export interface ChatMessage {
	id: UUID,
	chatId: UUID,
	senderId: UUID,
	content: string,
	createdAt: Date,
}
