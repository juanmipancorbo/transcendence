"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PublicUser } from "@/types";

interface TopBarProps {
  withSidebar?: boolean;
  friendRequests?: PublicUser[];
  pendingFriendAction?: string | null;
  onAcceptFriend?: (senderId: string) => void;
  onDeclineFriend?: (senderId: string) => void;
}

export default function TopBar({
  withSidebar = false,
  friendRequests = [],
  pendingFriendAction = null,
  onAcceptFriend,
  onDeclineFriend,
}: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [requestsOpen, setRequestsOpen] = useState(false);
  const requestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestsOpen) return;

    function closeRequests(event: MouseEvent) {
      if (!requestsRef.current?.contains(event.target as Node))
        setRequestsOpen(false);
    }

    document.addEventListener("mousedown", closeRequests);
    return () => document.removeEventListener("mousedown", closeRequests);
  }, [requestsOpen]);

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
          <div className="relative" ref={requestsRef}>
            <button
              type="button"
              onClick={() => setRequestsOpen(open => !open)}
              aria-label="Friend requests"
              aria-expanded={requestsOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/30 bg-surface-container-highest text-on-surface-variant transition-colors hover:border-violet-400 hover:text-primary"
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              {friendRequests.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                  {friendRequests.length > 9 ? "9+" : friendRequests.length}
                </span>
              )}
            </button>

            {requestsOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-2xl">
                <div className="border-b border-outline-variant/20 px-4 py-3">
                  <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Friend requests</p>
                </div>

                {friendRequests.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-on-surface-variant">No pending requests.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {friendRequests.map(request => {
                      const isPending = pendingFriendAction === request.id;
                      return (
                        <div key={request.id} className="flex items-center gap-3 border-b border-outline-variant/10 px-4 py-3 last:border-0">
                          <Link href={`/friend?id=${request.id}`} onClick={() => setRequestsOpen(false)} className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest font-headline text-sm font-bold text-primary">
                              {request.avatarUrl ? <img src={request.avatarUrl} alt="" className="h-full w-full object-cover" /> : request.username[0]?.toUpperCase()}
                            </div>
                            <span className="truncate text-sm font-semibold text-on-surface">{request.username}</span>
                          </Link>
                          <button type="button" disabled={isPending} onClick={() => onAcceptFriend?.(request.id)} aria-label={`Accept ${request.username}'s friend request`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 disabled:opacity-40">
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                          <button type="button" disabled={isPending} onClick={() => onDeclineFriend?.(request.id)} aria-label={`Decline ${request.username}'s friend request`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-error transition-colors hover:bg-error/10 disabled:opacity-40">
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
