"use client";

import { useState, useEffect, useRef } from "react";
import { getTokens, useAuth } from "@/hooks/useAuth";
import { friendApi, userApi } from "@/lib/api";
import type { PublicUser } from "@/types";
import { useMsg } from "@/hooks/useMsg";
import Avatar from "@/components/ui/Avatar";
import MatchHistory from "@/components/layout/MatchHistory";
import Achievements from "@/components/layout/Achievements";

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const { message, error } = useMsg();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    setProfileLoading(true);
    userApi.getProfile(user.id)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false));
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
    setBio(profile?.bio ?? "");
  }, [profile?.bio]);

  const [editing,   setEditing]   = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio,  setDraftBio]  = useState("");
  const profileLocked = Boolean(user?.currentGame);

  function handleEdit() {
    if (profileLocked) return;
    setDraftName(user?.username ?? "");
    setDraftBio(bio);
    setEditing(true);
  }

  async function handleSave() {
    if (profileLocked) {
      setEditing(false);
      error("Profile cannot be changed during a game");
      return;
    }

    const nextName = draftName.trim();
    const nextBio = draftBio.trim();
    if (nextName.length < 3 || nextName.length > 16) {
      error("Username must be between 3 and 16 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nextName)) {
      error("Username can only contain letters, numbers, hyphen (-) and underscore (_)");
      return;
    }

    try {
      await userApi.updateProfile(user?.id ?? "", { username: nextName, bio: nextBio });
      await refreshUser();
      const refreshedProfile = await userApi.getProfile(user?.id ?? "");
      setBio(nextBio);
      if (user) {
        setUser({ ...user, username: nextName, bio: nextBio });
      }
      setProfile(current => current ? { ...current, username: nextName, bio: nextBio } : current);
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
      setEditing(false);
      message("Profile updated");
    } catch (err) {
      error(err instanceof Error ? err.message : "Could not update profile");
    }
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const token = getTokens()?.accessToken;

    if (!file || !token) {
      setAvatarError("Please select an image and make sure you are logged in.");
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxAvatarSizeBytes = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(file.type) || file.size > maxAvatarSizeBytes) {
      setAvatarError("Please choose a JPG, PNG, or WebP image up to 5MB.");
      event.target.value = "";
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const avatarUrl = await userApi.uploadAvatar(file, token);
      await refreshUser();
      const refreshedProfile = await userApi.getProfile(user?.id ?? "");
      setProfile(prev => prev ? { ...prev, avatarUrl } : prev);
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
      if (user) {
        setUser({ ...user, avatarUrl });
      }
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Failed to upload profile picture.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  }

  const displayName   = user?.username ?? "User";
  const matchesPlayed = profile?.gamesPlayed;
  const victories     = profile?.gamesWon;

  return (
    <>
      <main className="pixel-profile flex-grow p-12 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* ── Identity card ─────────────────────────────────────────── */}
          <section className="profile-card">

            {/* Avatar */}
            <Avatar avatarUrl={user?.avatarUrl} name={user?.username ?? "User"} className="profile-avatar-frame" />

            {/* Info */}
            <div className="flex-grow text-center md:text-left">

              {editing ? (
                <input
                  className="profile-edit-input mb-4"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  autoFocus
                  maxLength={16}
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
                <p className="profile-bio">
                  {profileLoading
                    ? <span className="invisible" aria-hidden="true">Loading profile</span>
                    : bio || <span className="text-on-surface-variant/40 italic">No bio yet.</span>}
                </p>
              )}

              <div className="flex justify-center md:justify-start gap-3 flex-wrap">
                {editing ? (
                  <>
                    <button type="button" onClick={handleSave} className="profile-edit-btn">
                      Save
                    </button>
                    <button type="button" onClick={handleCancel} className="profile-edit-btn danger">Cancel</button>
                  </>
                ) : !profileLocked ? (
                  <button type="button" onClick={handleEdit} className="profile-edit-btn">Edit Profile</button>
                ) : null}
                {!profileLocked && (
                  <label className={`profile-edit-btn secondary cursor-pointer ${avatarUploading ? "pointer-events-none opacity-60" : ""}`}>
                    {avatarUploading ? "Uploading..." : "Change Avatar"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={avatarUploading}
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              {avatarError && <p className="mt-3 text-sm text-red-400">{avatarError}</p>}
            </div>
          </section>

          {/* ── Stats grid ────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="profile-stat-card">
              <div className="profile-stat-value" style={{ color: "var(--primary)" }}>
                {matchesPlayed ?? "--"}
              </div>
              <div className="profile-stat-label">Matches_Played</div>
            </div>

            <div className="profile-stat-card secondary">
              <div className="profile-stat-value" style={{ color: "var(--secondary)" }}>
                {victories ?? "--"}
              </div>
              <div className="profile-stat-label">Victories</div>
            </div>
          </section>

          {profile && <Achievements user={profile} />}

          {/* ── Friends bar ───────────────────────────────────────────── */}
          <div className="friends-bar !flex-col !items-stretch">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {friends.length === 0
                ? <p className="text-xs text-on-surface-variant italic col-span-full">No friends yet.</p>
                : (showAllFriends ? friends : friends.slice(0, 4))
                    .map(friend => <FriendEntry key={friend.id} friend={friend} />)
              }
            </div>

            {friends.length > 4 && (
              <button
                type="button"
                className="btn-view-friends self-end"
                onClick={() => setShowAllFriends(show => !show)}
                aria-expanded={showAllFriends}
              >
                {showAllFriends ? (
                  "Show Fewer"
                ) : (
                  <>
                    <span aria-hidden="true" className="mr-2 text-base leading-none">...</span>
                    View All Friends (+{friends.length - 4})
                  </>
                )}
              </button>
            )}
          </div>
		  <MatchHistory />

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
      <Avatar avatarUrl={friend.avatarUrl} name={friend.username} className="friend-avatar">
        <div className={`friend-status-dot ${friend.status}`} />
      </Avatar>

      <div className="hidden sm:block">
        <div className="friend-name">{friend.username}</div>
        <div className="friend-status-label" style={{ color: statusColor }}>{statusLabel}</div>
      </div>

      {pos && (
        <div
          className="pixel-friend-popover w-44 overflow-hidden z-50"
          style={{
            position: "fixed",
            top: pos.top - 8,
            left: pos.left,
            transform: "translateY(-100%)",
            background: "var(--surface-container-high)",
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setPos(null); window.open(`/friend?id=${friend.id}`, "_blank"); }}
            className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-surface-container-highest transition-colors"
            style={{ color: "var(--on-surface)" }}
          >
            View Profile ↗
          </button>
          {friend.status === "busy" && friend.currentGame && friend.currentGameAllowsSpectators && (
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
