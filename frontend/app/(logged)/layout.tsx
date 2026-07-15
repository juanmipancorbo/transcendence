"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokens, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { GameSocket } from "@/lib/ws/socket";
import { Chat, WsContext } from "@/hooks/useWs";
import { WS_URL } from "@/lib/config";
import { useMsg } from "@/hooks/useMsg";
import { buildJoinQueue, buildLeaveQueue, ByteReader } from "@/lib/ws/stream-utils";
import { chatApi, friendApi } from "@/lib/api";
import ChatWindow from "@/components/layout/ChatWindow";
import { GlobalProtocol, ProtocolCodes, PublicUser } from "@/types";

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
  const chatsRef = useRef(chats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [friendRequests, setFriendRequests] = useState<PublicUser[]>([]);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [pendingFriendAction, setPendingFriendAction] = useState<string | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [handlers, setHandlers] = useState<((p: ByteReader) => void)[]>([]);

  const loadSocialState = useCallback(async () => {
    const token = getTokens()?.accessToken;
    if (!token) return;

    try {
      const [requests, friendProfiles] = await Promise.all([
        friendApi.getIncomingRequests(token),
        friendApi.getProfiles(token),
      ]);
      setFriendRequests(requests);
      setFriends(friendProfiles);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to load friends");
    }
  }, [error]);

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
      sock.ondisconnect = () => {
        router.refresh();
      }
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadSocialState();
    const refresh = () => loadSocialState();
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [isAuthenticated, loadSocialState]);

  useEffect(() => {
    chatsRef.current = chats;
    if (activeChat) {
      setActiveChat(prev => {
        const newChat = chats.get(prev?.friendId ?? "");
        return newChat ?? null;
      });
    }
  }, [chats]);

  useLayoutEffect(() => {
    if (socket) {
      // ------- WS Callbacks -------
      function onError(p: ByteReader) {
        const message = p.readPrefixedUTF();
        const code = p.readUint8();
        error(message);
        if (code === ProtocolCodes.QueueFailed) {
          setInQueue(false);
          console.log("[Matchmaking] Left queue");
        }
      }

      function onInfoMessage(p: ByteReader) {
        message(p.readPrefixedUTF());
      }

      function onMatchFound(p: ByteReader) {
        const gameId = p.readPrefixedUTF();
        const _opponent = p.readPrefixedUTF(); // TODO: An animation or something maybe?

        setInQueue(false);
        console.log(`Match found with id ${gameId}`);
        router.push(`/game?id=${gameId}`);
      }

      function onFriendRequest(p: ByteReader) {
        p.readPrefixedUTF();
        message("You received a friend request");
        loadSocialState();
      }

      function onFriendChatMessage(p: ByteReader) {
        const sender = p.readPrefixedUTF();
        const content = p.readPrefixedUTF();
        const incoming = { createdAt: new Date().toISOString(), content, senderId: sender };

        const existing = chatsRef.current.get(sender);
        const updated: Chat = existing
          ? { ...existing, messages: [incoming, ...existing.messages] }
          : {
              friendId: sender,
              chatId: sender,
              isFinal: false,
              loadMoreMessages: () => loadMoreMessages(sender),
              messages: [incoming],
            };

        setChats(prev => new Map(prev).set(sender, updated));
        setActiveChat(active => active?.friendId === sender ? updated : active ?? updated);
      }

      const handlers: ((p: ByteReader) => void)[] = [];

      handlers[GlobalProtocol.Error] = onError;
      handlers[GlobalProtocol.Info] = onInfoMessage;
      handlers[GlobalProtocol.MatchFound] = onMatchFound;
      handlers[GlobalProtocol.FriendReqSend] = onFriendRequest;
      handlers[GlobalProtocol.Chat] = onFriendChatMessage;

      socket.handlers = handlers;
	  setHandlers(handlers);
      // ------- WS Callbacks End -------
    }
  }, [socket, error, loadSocialState, message, router]);

  async function respondToFriendRequest(senderId: string, accept: boolean) {
    const token = getTokens()?.accessToken;
    if (!token || pendingFriendAction) return;

    setPendingFriendAction(senderId);
    try {
      if (accept)
        await friendApi.acceptRequest(token, senderId);
      else
        await friendApi.declineRequest(token, senderId);

      await loadSocialState();
      message(accept ? "Friend request accepted" : "Friend request declined");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to update friend request");
      await loadSocialState();
    } finally {
      setPendingFriendAction(null);
    }
  }

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
    const token = getTokens()?.accessToken;
    if (!token) return;

    const chat = chatsRef.current.get(friendId);
    if (!chat || chat.isFinal) return;

    const before = chat.messages.length ? chat.messages[chat.messages.length - 1].createdAt : new Date().toISOString();
    const data = await chatApi.getHistory(token, friendId, { before, limit: 50 });

    setChats(prev => {
      const current = prev.get(friendId);
      if (!current) return prev;

      const map = new Map(prev);
      map.set(friendId, {
        ...current,
        messages: [...current.messages, ...data],
        isFinal: data.length !== 50,
      });
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

  // ------- Ws Context Functions -------
  function openChat(friendId: string) {
    const existing = chats.get(friendId);
    if (existing) {
      setActiveChat(existing);
      return;
    }

    const chat: Chat = {
      friendId,
      chatId: friendId,
      isFinal: false,
      loadMoreMessages: () => loadMoreMessages(friendId),
      messages: [],
    };
    setChats(prev => new Map(prev).set(friendId, chat));
    setActiveChat(chat);

    const token = getTokens()?.accessToken;
    if (!token) return;
    chatApi.getHistory(token, friendId, { before: new Date().toISOString(), limit: 50 })
      .then(data => {
        setChats(prev => {
          const current = prev.get(friendId);
          if (!current) return prev;
          const map = new Map(prev);
          map.set(friendId, { ...current, messages: data, isFinal: data.length !== 50 });
          return map;
        });
      })
      .catch(() => error("Could not load chat history"));
  }

  function closeChat() {
    setActiveChat(null);
  }

  function joinQueue() {
    socket?.send(buildJoinQueue());
    setInQueue(true);
    console.log("[Matchmaking] Joined queue");
  }

  function leaveQueue() {
    socket?.send(buildLeaveQueue());
    setInQueue(false);
    console.log("[Matchmaking] Left queue");
  }
  // ------- Ws Context Functions End -------

  return (
    <div className="dark min-h-screen bg-background text-on-surface">
      <div className="ml-64 flex flex-col min-h-screen">
<<<<<<< HEAD
        <TopBar
          withSidebar
          friendRequests={friendRequests}
          friends={friends}
          pendingFriendAction={pendingFriendAction}
          onAcceptFriend={senderId => respondToFriendRequest(senderId, true)}
          onDeclineFriend={senderId => respondToFriendRequest(senderId, false)}
          onOpenChat={openChat}
        />
        <main className="flex-1">
          <WsContext.Provider value={{ socket, chats, openChat, closeChat, joinQueue, leaveQueue, globalHandler: handlers, inQueue }}>
=======
        <WsContext.Provider value={{ socket, chats, openChat, closeChat, joinQueue, leaveQueue, globalHandler: handlers, inQueue, inGame, setInGame }}>
          <TopBar withSidebar />
          <main className="flex-1">
>>>>>>> 7b1cf69 (Game rejoin)
            {children}
            {activeChat && <ChatWindow chat={activeChat} onClose={closeChat} />}
          </main>
        </WsContext.Provider>
      </div>
      <Sidebar />
    </div>
  );
}
