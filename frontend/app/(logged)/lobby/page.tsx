"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueue } from "@/hooks/useGame";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const { user } = useAuth();

  const { inQueue, joinQueue, leaveQueue } = useQueue();
  const [elapsed,  setElapsed]  = useState(0);

  useEffect(() => {
    if (!inQueue) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [inQueue]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}_`;

  const xpProgress = user ? (user.xp % 1000) / 10 : 0;

  return (
    <>
      <div className="p-8">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-8">

          {/* ── Hero banner ──────────────────────────────────────────── */}
          <section className="hero-section">
            <div className="hero-gradient-overlay" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tertiary/5" />

            <div className="hero-content">
              <h1 className="hero-title">
                READY_FOR <br />
                <span className="text-primary italic">DEPLOYMENT</span>
              </h1>

              <div className="mt-8 flex gap-4 w-full md:w-auto">
                {!inQueue ? (
                  <button
                    onClick={() => joinQueue(matchFound)}
                    className="btn-find-match"
                  >
                    FIND MATCH
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </button>
                ) : (
                  <button
                    onClick={() => leaveQueue()}
                    className="btn-cancel-queue"
                  >
                    CANCEL SEARCH
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}

                <div className="queue-timer">
                  <span className="label-micro">
                    {inQueue ? "Queue Time" : "Avg Queue"}
                  </span>
                  <span className="text-xl font-bold text-white tracking-widest font-headline">
                    {inQueue ? fmt(elapsed) : "???"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/*  Mode card  */}
          <div className="mode-card">
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1">
                <div className="mode-card-label">Protocol_QuickMatch</div>
                <h3 className="mode-card-title">Find Match</h3>
                <p className="text-on-surface-variant text-base font-medium leading-relaxed max-w-2xl">
                  Initialize core combat protocols. System will automatically match you based on skill level
                  and region availability. Experience gains and rank adjustments enabled for all sessions.
                </p>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="flex justify-between items-end mb-2">
                  <span className="label-micro accent">Level Progress</span>
                  <span className="label-micro text-on-surface">LVL {user?.level ?? 0}</span>
                </div>
                <div className="xp-bar-track">
                  <div
                    className="xp-bar-fill"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "GLOBAL_RANK", value: `#${/*TODO: user?.rank ?? */0}`,   color: "text-primary" },
              { label: "WINS",        value: user?.gamesWon ?? 0,          color: "text-secondary" },
              { label: "LOSSES",      value: user?.gamesLost ?? 0,        color: "text-on-surface-variant" },
              { label: "WIN_RATE",    value: `${user ? Math.round(user.gamesWon / (user.gamesWon + user.gamesLost) * 100) : 0}%`, color: "text-tertiary" },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
               <div className={`stat-card-value ${color}`}>{value}</div>
                  <div className="stat-card-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
