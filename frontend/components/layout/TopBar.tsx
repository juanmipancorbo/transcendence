"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PublicUser } from "@/types";
import CurrentGame from "./CurrentGame";

interface TopBarProps {
  withSidebar?: boolean;
  friendRequests?: PublicUser[];
  friends?: PublicUser[];
  pendingFriendAction?: string | null;
  onAcceptFriend?: (senderId: string) => void;
  onDeclineFriend?: (senderId: string) => void;
  onOpenChat?: (friendId: string) => void;
}

export default function TopBar({
  withSidebar = false,
  friendRequests = [],
  friends = [],
  pendingFriendAction = null,
  onAcceptFriend,
  onDeclineFriend,
  onOpenChat,
}: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isInGame = pathname.startsWith("/game");
  const [friendsOpen, setFriendsOpen] = useState(false);
  const friendsRef = useRef<HTMLDivElement>(null);

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
    await logout();
    router.push("/login");
  };

  return (
    <header className={`w-full top-0 sticky z-40 backdrop-blur-xl bg-gradient-to-b from-[#0e0e13] to-transparent ${withSidebar ? "" : ""}`}>
      <div className="flex justify-between items-center px-8 py-6 w-full">
        <div className="text-2xl font-black italic tracking-widest text-violet-500 font-headline uppercase select-none">
          FT_TRANSCENDENCE
        </div>
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
              {friendRequests.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                  {friendRequests.length > 9 ? "9+" : friendRequests.length}
                </span>
              )}
            </button>

            {friendsOpen && (
              <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-2xl">
                <section>
                  <div className="border-b border-outline-variant/20 px-4 py-3">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Requests</p>
                  </div>
                  {friendRequests.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-on-surface-variant">No pending requests.</p>
                  ) : friendRequests.map(request => {
                    const isPending = pendingFriendAction === request.id;
                    return (
                      <div key={request.id} className="flex items-center gap-3 border-b border-outline-variant/10 px-4 py-3">
                        <Link href={`/friend?id=${request.id}`} onClick={() => setFriendsOpen(false)} className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface hover:text-primary">
                          {request.username}
                        </Link>
                        <button type="button" disabled={isPending} onClick={() => onAcceptFriend?.(request.id)} className="rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-40">Accept</button>
                        <button type="button" disabled={isPending} onClick={() => onDeclineFriend?.(request.id)} className="rounded px-2 py-1 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-40">Decline</button>
                      </div>
                    );
                  })}
                </section>

                <section className="border-t border-outline-variant/20">
                  <div className="border-b border-outline-variant/20 px-4 py-3">
                    <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Friends</p>
                  </div>
                  {friends.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-on-surface-variant">No friends yet.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {friends.map(friend => (
                        <div key={friend.id} className="flex items-center gap-3 border-b border-outline-variant/10 px-4 py-3 last:border-0">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${friend.status === "online" ? "bg-primary" : friend.status === "busy" ? "bg-tertiary" : "bg-outline-variant"}`} />
                          <Link href={`/friend?id=${friend.id}`} onClick={() => setFriendsOpen(false)} className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface hover:text-primary">
                            {friend.username}
                          </Link>
                          <button
                            type="button"
                            disabled={isInGame}
                            onClick={() => { setFriendsOpen(false); onOpenChat?.(friend.id); }}
                            title={isInGame ? "Use the game chat while a match is active" : `Chat with ${friend.username}`}
                            className="rounded px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:text-on-surface-variant disabled:hover:bg-transparent"
                          >
                            {isInGame ? "Use game chat" : "Chat"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full border border-violet-500/30 bg-surface-container-highest flex items-center justify-center font-headline font-bold text-sm text-primary hover:border-violet-400 transition-colors">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
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
