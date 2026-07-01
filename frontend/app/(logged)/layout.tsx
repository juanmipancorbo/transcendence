"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokens, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar  from "@/components/layout/TopBar";
import { GameSocket } from "@/lib/ws/socket";
import { Chat, WsContext } from "@/hooks/useWs";
import { WS_URL } from "@/lib/config";
import { useMsg } from "@/hooks/useMsg";
import { ByteReader } from "@/lib/ws/stream-utils";
import { chatApi } from "@/lib/api";
import ChatWindow from "@/components/layout/ChatWindow";
import { GlobalProtocol } from "@/types";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { message, error } = useMsg();
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [chats, setChats] = useState<Map<string, Chat>>(new Map());
  const [activeChat, setActiveChat] = useState<Chat | null>(null); // TODO: open this chat
  const [inQueue, setInQueue] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

	const tokens = getTokens();
	if (!socket && isAuthenticated && tokens) {
      const sock = new GameSocket(WS_URL + "/ws/create", tokens.accessToken, (e) => {
		if (e) return setFatalError(`Connection error: ${e.message}`);
		setSocket(sock);
	  });
	}
  }, [isAuthenticated, isLoading, router]);

  if (fatalError) {
    return (
      <div className="dark min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 label-micro">{fatalError}</p>
        </div>
      </div>
    );
  }

  // Convenience function for fetching messages history
  async function loadMoreMessages(friendId: string) {
    const chat = chats.get(friendId);
    if (!chat || chat.isFinal) return;

    const before = chat.messages.length ? new Date(chat.messages[chat.messages.length - 1].createdAt) : new Date();
    const data = await chatApi.getHistory(getTokens()!.accessToken, chat.friendId, { before: before.toISOString(), limit: 50 });

	setChats(prev => {
      const map = new Map(prev);
	  map.set(friendId, {
        ...chat,
        messages: [
          ...chat.messages,
		  ...data
        ],
		isFinal: data.length !== 50,
      });
      map.set(friendId, chat);
      return map;
	});
  }

  if (isLoading || !socket || !socket.isConnected) {
    return (
      <div className="dark min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 label-micro">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <></>;
  }

  useEffect(() => {
    if (activeChat) {
      setActiveChat(prev => {
        const newChat = chats.get(prev?.friendId ?? "");
        return newChat ?? null;
	  });
	}
  }, [chats]);

  // ------- WS Callbacks -------
  function onError(p: ByteReader) {
    error(p.readPrefixedUTF());
  }

  function onInfoMessage(p: ByteReader) {
    message(p.readPrefixedUTF());
  }

  function onMatchFound(p: ByteReader) {
    const gameId = p.readPrefixedUTF();
    const _opponent = p.readPrefixedUTF();

    // TODO
  }

  function onFriendRequest(p: ByteReader) {
    const from = p.readPrefixedUTF();

    // TODO
  }

  function onFriendChatMessage(p: ByteReader) {
    const sender = p.readPrefixedUTF();
    const message = p.readPrefixedUTF();
    setChats(prev => {
      const chat = prev.get(sender);
      if (!chat) return prev;

      const map = new Map(prev);
	  map.set(sender, {
        ...chat,
        messages: [
          { createdAt: new Date().toISOString(), content: message, senderId: sender },
          ...chat.messages,
        ],
      });
      map.set(sender, chat);
      return map;
    });
  }

  const handlers: ((p: ByteReader) => void)[] = [];

  handlers[GlobalProtocol.Error] = onError;
  handlers[GlobalProtocol.Info] = onInfoMessage;
  handlers[GlobalProtocol.MatchFound] = onMatchFound;
  handlers[GlobalProtocol.FriendReqSend] = onFriendRequest;
  handlers[GlobalProtocol.Chat] = onFriendChatMessage;

  socket.handlers = handlers;
  // ------- WS Callbacks End -------

  // ------- Ws Context Functions -------
  function openChat(friendId: string) {

  }

  function closeChat() {
    setActiveChat(null);
  }

  function joinQueue() {
    
  }

  function leaveQueue() {

  }
  // ------- Ws Context Functions End -------

  return (
    <div className="dark min-h-screen bg-background text-on-surface">
	    <div className="ml-64 flex flex-col min-h-screen">
          <TopBar withSidebar />
          <main className="flex-1">
		    <WsContext.Provider value={{ socket, chats, openChat, closeChat, joinQueue, leaveQueue, globalHandler: handlers, inQueue }}>
			  {children}
			  {activeChat && <ChatWindow chat={activeChat} onClose={closeChat} />}
		    </WsContext.Provider>
          </main>
        </div>
      <Sidebar />
    </div>
  );
}
