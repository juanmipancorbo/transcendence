import { ChatMessage } from "@endpoints/chat-response";
import * as Repo from "./repository"
import { ApiError } from "@utils/error";

const DEFAULT_LIMIT = 50;

// Store a message from one user to another.
export async function addChatMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
	if (senderId === receiverId)
		throw (new ApiError("INVALID_CREDENTIAL", 400));
	return Repo.insertMessage(senderId, receiverId, content);
}

// Read the conversation between the current user and another user.
export async function readChatHistory(userId: string, otherId: string, limit?: number, before?: Date): Promise<ChatMessage[]> {
	if (userId === otherId)
		throw (new ApiError("INVALID_CREDENTIAL", 400));
	const chatId = await Repo.selectChatId(userId, otherId);
	if (!chatId)
		return [];
	return Repo.selectChatHistory(chatId, limit ?? DEFAULT_LIMIT, before);
}
