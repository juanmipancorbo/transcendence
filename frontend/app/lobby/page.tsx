"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQueue } from "@/hooks/useGame";

export default function LobbyPage() {
  const { user } = useAuth();
  const { inQueue, joinQueue, leaveQueue } = useQueue();
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!inQueue) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [inQueue]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "00")}:${String(s % 60).padStart(2, "00")}_`;

  return (
    <ProtectedLayout activeRoute="/lobby">
      <div className="p-8">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-8">

          {/* ── Hero banner ──────────────────────────────────────────── */}
          <section className="hero-section">
            <div className="hero-gradient-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tertiary/5" />

            <div className="hero-content">
              <span className="live-badge">
                <span className="live-dot" />
                <span className="label-micro">Live Now: Sector 7 Championship</span>
              </span>

              <h1 className="hero-title">
                READY_FOR <br />
                <span className="text-primary italic">DEPLOYMENT</span>
              </h1>

              <div className="mt-8 flex gap-4 w-full md:w-auto">
                {!inQueue ? (
                  <button
                    onClick={() => joinQueue(foundGame => router.push(`/game?id=${foundGame}`))}
                    disabled={status !== "connected"}
                    className="btn-find-match"
                  >
                    FIND MATCH
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </button>
                ) : (
                  <button onClick={leaveQueue} className="btn-cancel-queue">
                    CANCEL SEARCH
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}

                <div className="queue-timer">
                  <span className="label-micro">{inQueue ? "Queue Time" : "Avg Queue"}</span>
                  <span className="text-xl font-bold text-white tracking-widest font-headline">
                    {inQueue ? fmt(elapsed) : "02:45_"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mode card ────────────────────────────────────────────── */}
          <div className="mode-card">
            <div className="absolute top-0 right-0 p-8 flex gap-4">
              <span className="material-symbols-outlined text-primary">stars</span>
              <span className="material-symbols-outlined text-secondary">rocket_launch</span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1">
                <div className="mode-card-label">Protocol_Unified_Nexus</div>
                <h3 className="mode-card-title">Find Match</h3>
                <p className="text-on-surface-variant text-base font-medium leading-relaxed max-w-2xl">
                  Initialize core combat protocols. System will automatically match you based on skill level
                  and region availability. Experience gains and rank adjustments enabled for all sessions.
                </p>
              </div>

              {user && (
                <div className="w-full md:w-72 shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="label-micro accent">Level Progress</span>
                    <span className="label-micro text-on-surface">LVL {user.level}</span>
                  </div>
                  <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${(user.xp % 1000) / 10}%` }} />
                  </div>
                  <div className="mt-4 label-micro text-right italic" style={{ opacity: 0.6 }}>
                    Authentication Status: Verified
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Stats row ────────────────────────────────────────────── */}
          {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "GLOBAL_RANK", value: `#${user.rank}`,  color: "text-primary"            },
                { label: "WINS",        value: user.wins,         color: "text-secondary"          },
                { label: "LOSSES",      value: user.losses,       color: "text-on-surface-variant" },
                { label: "WIN_RATE",    value: user.wins + user.losses > 0
                    ? `${Math.round(user.wins / (user.wins + user.losses) * 100)}%`
                    : "—",                                        color: "text-tertiary"           },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card">
                  <div className={`stat-card-value ${color}`}>{value}</div>
                  <div className="stat-card-label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-item active">
          <span className="material-symbols-outlined">sports_esports</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Lobby</span>
        </div>
        <div className="mobile-nav-item">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Ranking</span>
        </div>
        <div className="mobile-nav-item">
          <div className="mobile-nav-fab">
            <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          </div>
        </div>
        <div className="mobile-nav-item">
          <span className="material-symbols-outlined">person_search</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Profile</span>
        </div>
        <div className="mobile-nav-item">
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Chat</span>
        </div>
      </nav>
    </ProtectedLayout>
  );
}
