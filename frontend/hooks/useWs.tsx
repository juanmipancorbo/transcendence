"use client";

import { chatApi } from "@/lib/api";
import { GameSocket } from "@/lib/ws/socket";
import { ChatMessage } from "@/types";
import { createContext, useContext } from "react";
import { getTokens } from "./useAuth";

export class Chat {
	friendId: string;
	chatId: string;
	messages: ChatMessage[] =  [];

	constructor(friendId: string, chatId: string) {
		this.friendId = friendId;
		this.chatId = chatId;
	}

	async loadMoreMessages() {
		const before = this.messages.length ? new Date(this.messages[this.messages.length - 1].createdAt) : new Date();
		const data = await chatApi.getHistory(getTokens()!.accessToken, this.friendId, { before: before.toISOString(), limit: 50 });
		this.messages.push(...data);
	}
}

interface WsContextValue {
	socket: GameSocket,
	chats: Map<string, Chat> // Friend id, chat
}

export const WsContext = createContext<WsContextValue | null>(null);

export function useWs(): WsContextValue {
	const ws = useContext(WsContext);
	if (!ws) throw new Error("useWs must be used inside WsContextValue context");
	return ws;
}
