"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokens, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { GameSocket } from "@/lib/ws/socket";
import { Chat, WsContext } from "@/hooks/useWs";
import { getWebSocketUrl } from "@/lib/config";
import { useMsg } from "@/hooks/useMsg";
import { buildJoinQueue, buildLeaveQueue, ByteReader } from "@/lib/ws/stream-utils";
import { chatApi, friendApi, userApi } from "@/lib/api";
import ChatWindow from "@/components/layout/ChatWindow";
import PixelLoader from "@/components/ui/PixelLoader";
import { DuelRequest, GlobalProtocol, ProtocolCodes, PublicUser } from "@/types";
import StackLayout from "@/components/ui/StackLayout";
import DuelPrompt from "@/components/layout/DuelPrompt";

interface ProtectedShellProps {
  children: React.ReactNode;
}

/**
 * Client shell for every authenticated route: auth gate, game socket, chat
 * and the surrounding chrome.
 *
 * Lives outside app/ so that app/(logged)/layout.tsx can stay a server
 * component and export the noindex metadata for this whole route group.
 */
export default function ProtectedShell({ children }: ProtectedShellProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { message, error } = useMsg();
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [chats, setChats] = useState<Map<string, Chat>>(new Map());
  const chatsRef = useRef(chats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const activeChatRef = useRef<Chat | null>(null);
  const [unreadChats, setUnreadChats] = useState<Record<string, number>>({});
  const [friendRequests, setFriendRequests] = useState<PublicUser[]>([]);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [pendingFriendAction, setPendingFriendAction] = useState<string | null>(null);
  const [inQueue, setInQueue] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [duels, setDuels] = useState<DuelRequest[]>([]);
  const previousInGameRef = useRef(false);
  const [handlers, setHandlers] = useState<((p: ByteReader) => void)[]>([]);

  const loadSocialState = useCallback(async () => {
    const token = getTokens()?.accessToken;
    if (!token) return;

    try {
      const [requests, friendProfiles, unread] = await Promise.all([
        friendApi.getIncomingRequests(token),
        friendApi.getProfiles(token),
        chatApi.getUnread(token),
      ]);
      setFriendRequests(requests);
      setFriends(friendProfiles);
      setUnreadChats(Object.fromEntries(unread.map(item => [item.friendId, item.count])));
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to load friends");
    }
  }, [error]);

  const markChatRead = useCallback((friendId: string) => {
    const token = getTokens()?.accessToken;
    if (!token) return;
    setUnreadChats(current => {
      const { [friendId]: _removed, ...rest } = current;
      return rest;
    });
    chatApi.markRead(token, friendId).catch(() => loadSocialState());
  }, [loadSocialState]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    const tokens = getTokens();
    if (!socket && isAuthenticated && tokens) {
      const sock = new GameSocket(getWebSocketUrl() + "/ws/create", tokens.accessToken, (e) => {
        if (e) return setFatalError(`Connection error: ${e.message}`);
        setSocket(sock);
      });
      sock.ondisconnect = () => {
        router.refresh();
      };
    }
  }, [isAuthenticated, isLoading, router, socket]);

  useEffect(() => {
    if (!socket) return;
    return () => socket.disconnect(1000);
  }, [socket]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

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
    if (!inQueue || !user) return;

    let cancelled = false;
    let checking = false;
    const recoverMatch = async () => {
      if (checking) return;
      checking = true;
      try {
        const profile = await userApi.getProfile(user.id);
        if (cancelled || !profile.currentGame) return;

        setInQueue(false);

        router.push("/game?id=" + profile.currentGame);
      } catch {
        // MatchFound remains the primary path; retry while the user is queued.
      } finally {
        checking = false;
      }
    };

    const interval = window.setInterval(recoverMatch, 1000);
    recoverMatch();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [inQueue, user, router]);

  useEffect(() => {
    if (previousInGameRef.current && !inGame) loadSocialState();
    previousInGameRef.current = inGame;
  }, [inGame, loadSocialState]);

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
        }
      }

      function onInfoMessage(p: ByteReader) {
        message(p.readPrefixedUTF());
      }

      function onMatchFound(p: ByteReader) {
        const gameId = p.readPrefixedUTF();
        const _opponent = p.readPrefixedUTF(); // TODO: An animation or something maybe?

        setInQueue(false);
        router.push(`/game?id=${gameId}`);
      }

      function onFriendRequest(p: ByteReader) {
        p.readPrefixedUTF();
        message("You received a friend request");
        loadSocialState();
      }

	  function onDuelReceive(p: ByteReader) {
        const from = p.readPrefixedUTF();
		const allowSpectators = p.readBool();
		const secsLimit = p.readInt32();

		setDuels(prev => [...prev.filter(d => d.from !== from), { from, allowSpectators, secsLimit }]);
		setTimeout(() => setDuels(prev => prev.filter(d => d.from !== from)), 15000); // Clean after 15 secs
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

        const currentActive = activeChatRef.current;
        if (!currentActive || currentActive.friendId === sender) {
          markChatRead(sender);
        } else {
          setUnreadChats(current => ({ ...current, [sender]: (current[sender] ?? 0) + 1 }));
        }

        setChats(prev => new Map(prev).set(sender, updated));
        setActiveChat(active => active?.friendId === sender ? updated : active ?? updated);
      }

      const handlers: ((p: ByteReader) => void)[] = [];

      handlers[GlobalProtocol.Error] = onError;
      handlers[GlobalProtocol.Info] = onInfoMessage;
      handlers[GlobalProtocol.MatchFound] = onMatchFound;
      handlers[GlobalProtocol.FriendReqSend] = onFriendRequest;
	  handlers[GlobalProtocol.DuelRequest] = onDuelReceive;
      handlers[GlobalProtocol.Chat] = onFriendChatMessage;

      socket.handlers = handlers;
	  setHandlers(handlers);
      // ------- WS Callbacks End -------
    }
  }, [socket, error, loadSocialState, markChatRead, message, router]);

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
        <PixelLoader label={fatalError} />
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
        <PixelLoader label="Loading game room..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <></>;
  }

  // ------- Ws Context Functions -------
  function openChat(friendId: string) {
    markChatRead(friendId);
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
  }

  function leaveQueue() {
    socket?.send(buildLeaveQueue());
    setInQueue(false);
  }
  // ------- Ws Context Functions End -------

  return (
    <div className="retro-shell dark min-h-screen bg-background text-on-surface">
      <div className="ml-64 flex flex-col min-h-screen">
        <WsContext.Provider value={{ socket, chats, openChat, closeChat, joinQueue, leaveQueue, globalHandler: handlers, inQueue, inGame, setInGame }}>
          <TopBar
            withSidebar
            friendRequests={friendRequests}
            friends={friends}
            unreadChats={unreadChats}
            pendingFriendAction={pendingFriendAction}
            onAcceptFriend={senderId => respondToFriendRequest(senderId, true)}
            onDeclineFriend={senderId => respondToFriendRequest(senderId, false)}
            onOpenChat={openChat}
          />
          <main className="flex-1">
            {children}
            {activeChat && (
              <ChatWindow
                key={activeChat.friendId}
                chat={activeChat}
                friendProfile={friends.find(friend => friend.id === activeChat.friendId)}
                onClose={closeChat}
              />
            )}
          </main>
		  <StackLayout>
            {duels.map(duel => (
              <DuelPrompt
                key={duel.from}
                duel={duel}
                onDismiss={() => setDuels(prev => prev.filter(d => d.from !== duel.from))}
              />
            ))}
		  </StackLayout>
        </WsContext.Provider>
      </div>
      <Sidebar />
    </div>
  );
}
