"use client";

import { useState, useEffect, useRef } from "react";
import { getTokens, useAuth } from "@/hooks/useAuth";
import { friendApi, userApi } from "@/lib/api";
import type { PublicUser } from "@/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [friends, setFriends] = useState<PublicUser[]>([]);

  useEffect(() => {
    if (user?.id)
      userApi.getProfile(user.id).then(setProfile).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    function fetchFriends() {
      const token = getTokens()?.accessToken;
      if (token) friendApi.getProfiles(token).then(setFriends).catch(() => {});
    }
    fetchFriends();
    window.addEventListener("focus", fetchFriends);
    return () => window.removeEventListener("focus", fetchFriends);
  }, []);

  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setBio("");
      return;
    }
    setBio(localStorage.getItem(`profile-bio:${user.id}`) ?? "");
  }, [user?.id]);

  const [editing,   setEditing]   = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio,  setDraftBio]  = useState("");

  function handleEdit() {
    setDraftName(user?.username ?? "");
    setDraftBio(bio);
    setEditing(true);
  }

  function handleSave() {
    const nextBio = draftBio.trim();
    setBio(nextBio);
    if (user?.id)
      localStorage.setItem(`profile-bio:${user.id}`, nextBio);
    userApi.updateProfile(user?.id ?? "", { username: draftName }).catch(() => {});
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  const displayName   = user?.username ?? "User";
  const matchesPlayed = profile ? profile.gamesWon + profile.gamesLost : (user?.gamesWon ?? 0) + (user?.gamesLost ?? 0);
  const victories     = profile?.gamesWon ?? user?.gamesWon ?? 0;

  return (
    <>
      <main className="flex-grow p-12 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* ── Identity card ─────────────────────────────────────────── */}
          <section className="profile-card">

            {/* Avatar */}
            <div className="profile-avatar-frame">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl font-black" style={{ color: "var(--primary)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {(user?.username ?? "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left">

              {editing ? (
                <input
                  className="profile-edit-input mb-4"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  autoFocus
                  maxLength={32}
                  placeholder="Display name"
                />
              ) : (
                <h1 className="profile-username mb-4">{displayName}</h1>
              )}

              {editing ? (
                <textarea
                  className="profile-edit-textarea mb-4 resize-none h-20"
                  value={draftBio}
                  onChange={e => setDraftBio(e.target.value)}
                  maxLength={160}
                  placeholder="Short bio…"
                />
              ) : (
                <p className="profile-bio">{bio || <span className="text-on-surface-variant/40 italic">No bio yet.</span>}</p>
              )}

              <div className="flex justify-center md:justify-start gap-3">
                {editing ? (
                  <>
                    <button onClick={handleSave} className="btn-primary" style={{ width: "auto", padding: "0.75rem 2rem" }}>
                      Save
                    </button>
                    <button onClick={handleCancel} className="profile-edit-btn">Cancel</button>
                  </>
                ) : (
                  <button onClick={handleEdit} className="profile-edit-btn">Edit Profile</button>
                )}
              </div>
            </div>
          </section>

          {/* ── Stats grid ────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="profile-stat-card">
              <div className="profile-stat-value" style={{ color: "var(--primary)" }}>
                {matchesPlayed}
              </div>
              <div className="profile-stat-label">Matches_Played</div>
            </div>

            <div className="profile-stat-card secondary">
              <div className="profile-stat-value" style={{ color: "var(--secondary)" }}>
                {victories}
              </div>
              <div className="profile-stat-label">Victories</div>
            </div>
          </section>

          {/* ── Friends bar ───────────────────────────────────────────── */}
          <div className="friends-bar">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 min-w-0">
              <div className="flex gap-10">
                {friends.length === 0
                  ? <p className="text-xs text-on-surface-variant italic">No friends yet.</p>
                  : friends.map(friend => <FriendEntry key={friend.id} friend={friend} />)
                }
              </div>
            </div>

            <button className="btn-view-friends flex-shrink-0">
              View All Friends
            </button>
          </div>

        </div>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] blur-[120px]" style={{ background: "rgba(0,238,252,0.03)"   }} />
        <div className="ambient-blob -bottom-[5%]  -left-[5%]  w-[40%] h-[40%] blur-[100px]" style={{ background: "rgba(172,138,255,0.03)" }} />
      </div>
    </>
  );
}

function FriendEntry({ friend }: { friend: PublicUser }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    function close(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setPos(null);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pos]);

  function handleClick() {
    if (pos) { setPos(null); return; }
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.top, left: rect.left });
  }

  const statusColor = friend.status === "online" ? "var(--primary)"
                    : friend.status === "busy"   ? "#d575ff"
                    :                              "var(--outline-variant)";
  const statusLabel = friend.status === "busy" ? "Busy"
                    : friend.status === "online" ? "Online"
                    :                              "Offline";

  return (
    <div className="friend-entry flex-shrink-0" ref={ref} onClick={handleClick}>
      <div className="friend-avatar">
        <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-container-highest)" }}>
          <span className="text-sm font-black" style={{ color: "var(--on-surface-variant)", fontFamily: "Space Grotesk, sans-serif" }}>
            {friend.username[0].toUpperCase()}
          </span>
        </div>
        <div className={`friend-status-dot ${friend.status}`} />
      </div>

      <div className="hidden sm:block">
        <div className="friend-name">{friend.username}</div>
        <div className="friend-status-label" style={{ color: statusColor }}>{statusLabel}</div>
      </div>

      {pos && (
        <div
          className="w-44 rounded-lg overflow-hidden z-50"
          style={{
            position: "fixed",
            top: pos.top - 8,
            left: pos.left,
            transform: "translateY(-100%)",
            background: "var(--surface-container-high)",
            border: "1px solid rgba(72,71,77,0.3)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setPos(null); window.open(`/friend?id=${friend.id}`, "_blank"); }}
            className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-surface-container-highest transition-colors"
            style={{ color: "var(--on-surface)" }}
          >
            View Profile ↗
          </button>
          {friend.status === "busy" && friend.currentGame && (
            <button
              onClick={e => { e.stopPropagation(); setPos(null); window.open(`/game?id=${friend.currentGame}`, "_blank"); }}
              className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-surface-container-highest transition-colors"
              style={{ color: "#d575ff" }}
            >
              Watch Game ↗
            </button>
          )}
        </div>
      )}
    </div>
  );
}
