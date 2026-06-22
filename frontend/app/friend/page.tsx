"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { userApi } from "@/lib/api";
import type { User } from "@/types";

export default function FriendProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    userApi.getProfile(userId)
      .then(p => { setProfile(p); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  const displayName   = profile?.displayName ?? profile?.username ?? "User";
  const matchesPlayed = profile ? profile.wins + profile.losses : 0;
  const victories     = profile?.wins ?? 0;

  return (
    <ProtectedLayout activeRoute="">
      <main className="flex-grow p-12 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">

          {loading && (
            <p className="text-on-surface-variant italic text-center mt-24">Loading profile…</p>
          )}

          {!loading && notFound && (
            <p className="text-on-surface-variant italic text-center mt-24">User not found.</p>
          )}

          {!loading && profile && (
            <>
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
                        {(profile.username ?? "?")[0].toUpperCase()}
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
                  <h1 className="profile-username mb-4">{displayName}</h1>
                  <p className="profile-bio">
                    <span className="text-on-surface-variant/40 italic">No bio yet.</span>
                  </p>
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
            </>
          )}

        </div>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] blur-[120px]" style={{ background: "rgba(0,238,252,0.03)"   }} />
        <div className="ambient-blob -bottom-[5%]  -left-[5%]  w-[40%] h-[40%] blur-[100px]" style={{ background: "rgba(172,138,255,0.03)" }} />
      </div>
    </ProtectedLayout>
  );
}
