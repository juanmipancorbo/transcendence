"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

// TODO: fetch real user from userApi.getProfile(userId)
const MOCK_PROFILE = {
  id:            "1",
  username:      "ft_transcendance",
  displayName:   "FT_TRANSCENDANCE",
  bio:           "Master of the Digital Grid. Specializing in high-velocity combat and tactical maneuvering. Member since 2024.",
  avatarUrl:     null as string | null,  // TODO: real avatar URL
  matchesPlayed: 782,
  victories:     612,
};

// TODO: fetch from friendsApi.getList()
const MOCK_FRIENDS = [
  { id: "f1", username: "Cyan_Blade",  status: "online" as const, statusLabel: "Online" },
  { id: "f2", username: "Echo_Render", status: "online" as const, statusLabel: "Lobby"  },
];

export default function ProfilePage() {
  const [profile,   setProfile]   = useState(MOCK_PROFILE);
  const [editing,   setEditing]   = useState(false);
  const [draftName, setDraftName] = useState(profile.displayName);
  const [draftBio,  setDraftBio]  = useState(profile.bio);

  function handleEdit() {
    setDraftName(profile.displayName);
    setDraftBio(profile.bio);
    setEditing(true);
  }

  function handleSave() {
    // TODO: call userApi.updateProfile(profile.id, { displayName: draftName, bio: draftBio })
    setProfile(p => ({ ...p, displayName: draftName, bio: draftBio }));
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleViewAllFriends() {
    // TODO: navigate to /friends or open a modal
    console.log("View all friends");
  }

  return (
    <ProtectedLayout activeRoute="/profile">
      <main className="flex-grow p-12 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* ── Identity card ─────────────────────────────────────────── */}
          <section className="profile-card">

            {/* Avatar */}
            <div className="profile-avatar-frame">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl font-black" style={{ color: "var(--primary)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {profile.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="profile-avatar-badge">
                <span className="material-symbols-outlined text-base" style={{ color: "var(--surface)", fontVariationSettings: "'FILL' 1" }}>
                  military_tech
                </span>
              </div>
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
                <h1 className="profile-username mb-4">{profile.displayName}</h1>
              )}

              {editing ? (
                <textarea
                  className="profile-edit-input mb-4 resize-none h-20"
                  value={draftBio}
                  onChange={e => setDraftBio(e.target.value)}
                  maxLength={160}
                  placeholder="Short bio…"
                  style={{ fontSize: "0.95rem", fontWeight: 400, fontStyle: "normal" }}
                />
              ) : (
                <p className="profile-bio">{profile.bio}</p>
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
              {/* TODO: replace with real stats from API */}
              <div className="profile-stat-value" style={{ color: "var(--primary)" }}>
                {profile.matchesPlayed}
              </div>
              <div className="profile-stat-label">Matches_Played</div>
            </div>

            <div className="profile-stat-card secondary">
              {/* TODO: replace with real stats from API */}
              <div className="profile-stat-value" style={{ color: "var(--secondary)" }}>
                {profile.victories}
              </div>
              <div className="profile-stat-label">Victories</div>
            </div>
          </section>

          {/* ── Friends bar ───────────────────────────────────────────── */}
          <div className="friends-bar">
            <div className="flex gap-10 group">
              {/* TODO: replace MOCK_FRIENDS with friendsApi.getList() */}
              {MOCK_FRIENDS.map(friend => (
                <div
                  key={friend.id}
                  className="friend-entry"
                  onClick={() => {
                    // TODO: navigate to /profile?id=friend.id
                    console.log("Open friend profile:", friend.id);
                  }}
                >
                  <div className="friend-avatar">
                    {/* TODO: show real friend avatar when available */}
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-container-highest)" }}>
                      <span className="text-sm font-black" style={{ color: "var(--on-surface-variant)", fontFamily: "Space Grotesk, sans-serif" }}>
                        {friend.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className={`friend-status-dot ${friend.status}`} />
                  </div>

                  <div className="hidden sm:block">
                    <div className="friend-name">{friend.username}</div>
                    <div className="friend-status-label">{friend.statusLabel}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-view-friends" onClick={handleViewAllFriends}>
              View All Friends
            </button>
          </div>

        </div>
      </main>

      {/* Ambient background glows */}
      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] blur-[120px]" style={{ background: "rgba(0,238,252,0.03)"   }} />
        <div className="ambient-blob -bottom-[5%]  -left-[5%]  w-[40%] h-[40%] blur-[100px]" style={{ background: "rgba(172,138,255,0.03)" }} />
      </div>
    </ProtectedLayout>
  );
}
