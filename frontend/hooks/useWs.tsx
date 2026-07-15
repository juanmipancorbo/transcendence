"use client";

import { GameSocket } from "@/lib/ws/socket";
import { ByteReader } from "@/lib/ws/stream-utils";
import { SChatMessage } from "@/types";
import { createContext, useContext } from "react";

export interface Chat {
	friendId: string;
	chatId: string;
	messages: SChatMessage[];
	isFinal: boolean;
	loadMoreMessages: () => Promise<void>;
}

interface WsContextValue {
	socket: GameSocket,
	chats: Map<string, Chat>, // Friend id, chat
	globalHandler: ((p: ByteReader) => void)[],
	inQueue: boolean,
	inGame: boolean,
	setInGame: (value: boolean) => void,
	openChat: (friendId: string) => void,
	closeChat: () => void,
	joinQueue: () => void,
	leaveQueue: () => void
}

export const WsContext = createContext<WsContextValue | null>(null);

export function useWs(): WsContextValue {
	const ws = useContext(WsContext);
	if (!ws) throw new Error("useWs must be used inside WsContextValue context");
	return ws;
}
