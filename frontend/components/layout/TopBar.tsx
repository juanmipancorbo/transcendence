"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PublicUser } from "@/types";
import CurrentGame from "./CurrentGame";
import { useWs } from "@/hooks/useWs";
import Avatar from "@/components/ui/Avatar";

interface TopBarProps {
  withSidebar?: boolean;
  friendRequests?: PublicUser[];
  friends?: PublicUser[];
  pendingFriendAction?: string | null;
  unreadChats?: Record<string, number>;
  onAcceptFriend?: (senderId: string) => void;
  onDeclineFriend?: (senderId: string) => void;
  onOpenChat?: (friendId: string) => void;
}

export default function TopBar({
  withSidebar = false,
  friendRequests = [],
  friends = [],
  pendingFriendAction = null,
  unreadChats = {},
  onAcceptFriend,
  onDeclineFriend,
  onOpenChat,
}: TopBarProps) {
  const { user, logout } = useAuth();
  const { inGame, socket } = useWs();
  const router = useRouter();
  const pathname = usePathname();
  const [friendsOpen, setFriendsOpen] = useState(false);
  const friendsRef = useRef<HTMLDivElement>(null);
  const notificationCount = friendRequests.length + Object.values(unreadChats).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (!friendsOpen) return;

    function closeFriends(event: MouseEvent) {
      if (!friendsRef.current?.contains(event.target as Node))
        setFriendsOpen(false);
    }

    document.addEventListener("mousedown", closeFriends);
    return () => document.removeEventListener("mousedown", closeFriends);
  }, [friendsOpen]);

  const handleLogout = async () => {
    socket.disconnect(1000);
    await logout();
    router.push("/login");
  };

  return (
    <header className={`pixel-topbar sticky top-0 z-[70] w-full ${withSidebar ? "" : ""}`}>
      <div className="flex items-center px-8 py-6 w-full" style={{ justifyContent: pathname === "/lobby" ? "flex-end" : "space-between" }}>
        {pathname !== "/lobby" && (
          <div className="pixel-wordmark text-2xl font-black font-headline uppercase select-none">
            REVERSIVERSE
          </div>
        )}
        <div className="flex items-center gap-4">
		  <CurrentGame />
          <div className="relative" ref={friendsRef}>
            <button
              type="button"
              onClick={() => setFriendsOpen(open => !open)}
              aria-expanded={friendsOpen}
              className="relative h-10 rounded border border-violet-500/30 bg-surface-container-highest px-4 text-sm font-semibold text-on-surface transition-colors hover:border-violet-400 hover:text-primary"
            >
              Friends
              {notificationCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {friendsOpen && (
              <div className="pixel-friends-menu absolute right-0 top-12 z-[80] w-96 max-w-[calc(100vw-2rem)] overflow-hidden border bg-surface-container-high shadow-2xl">
                <section>
                  <div className="pixel-friends-heading border-b px-4 py-3">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Requests</p>
                  </div>
                  {friendRequests.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-on-surface-variant">No pending requests.</p>
                  ) : friendRequests.map(request => {
                    const isPending = pendingFriendAction === request.id;
                    return (
                      <div key={request.id} className="pixel-friend-row flex items-center gap-3 border-b px-4 py-3">
                        <Link href={`/friend?id=${request.id}`} onClick={() => setFriendsOpen(false)} className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface hover:text-primary">
                          {request.username}
                        </Link>
                        <button type="button" disabled={isPending} onClick={() => onAcceptFriend?.(request.id)} className="pixel-friend-accept px-2 py-1 text-xs font-semibold disabled:opacity-40">Accept</button>
                        <button type="button" disabled={isPending} onClick={() => onDeclineFriend?.(request.id)} className="pixel-friend-decline px-2 py-1 text-xs font-semibold disabled:opacity-40">Decline</button>
                      </div>
                    );
                  })}
                </section>

                <section className="border-t border-outline-variant/20">
                  <div className="pixel-friends-heading border-b px-4 py-3">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Friends</p>
                  </div>
                  {friends.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-on-surface-variant">No friends yet.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {friends.map(friend => (
                        <div key={friend.id} className="pixel-friend-row flex items-center gap-3 border-b px-4 py-3 last:border-0">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${friend.status === "online" ? "bg-primary" : friend.status === "busy" ? "bg-tertiary" : "bg-outline-variant"}`} />
                          <Link href={`/friend?id=${friend.id}`} onClick={() => setFriendsOpen(false)} className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface hover:text-primary">
                            {friend.username}
                          </Link>
                          {(unreadChats[friend.id] ?? 0) > 0 && (
                            <span className="inline-flex min-w-5 items-center justify-center rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-on-primary">
                              {unreadChats[friend.id] > 9 ? "9+" : unreadChats[friend.id]}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={inGame || friend.status !== "online"}
                            onClick={() => {
                              setFriendsOpen(false);
                              router.push("/friend?id=" + friend.id + "&duel=1");
                            }}
                            title={inGame ? "Finish your current game before starting a duel" : friend.status !== "online" ? friend.username + " is not available for a duel" : "Challenge " + friend.username}
                            className="pixel-friend-chat px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Duel
                          </button>
                          <button
                            type="button"
                            disabled={inGame || (friend.status === "busy" && !friend.currentGameAllowsSpectators)}
                            onClick={() => {
                              setFriendsOpen(false);
                              if (friend.status === "busy" && friend.currentGame && friend.currentGameAllowsSpectators)
                                router.push("/game?id=" + friend.currentGame);
                              else
                                onOpenChat?.(friend.id);
                            }}
                            title={inGame
                              ? "Use the game chat while a match is active"
                              : friend.status === "busy" && friend.currentGame && friend.currentGameAllowsSpectators
                                ? "Watch game by " + friend.username
                                : friend.status === "busy"
                                  ? friend.username + " is currently in a game"
                                  : "Chat with " + friend.username}
                            className="pixel-friend-chat px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {inGame ? "Use game chat" : friend.status === "busy" && friend.currentGame && friend.currentGameAllowsSpectators ? "Watch game" : friend.status === "busy" ? "In game" : "Chat"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
          <Link href="/profile" aria-label="View your profile" className="block w-10 h-10 border border-violet-500/30 bg-surface-container-highest hover:border-violet-400 transition-colors">
            <Avatar avatarUrl={user?.avatarUrl} name={user?.username ?? "User"} className="h-full w-full" />
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
