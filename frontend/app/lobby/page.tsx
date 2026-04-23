"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGame } from "@/hooks/useGame";
import type { GameMode } from "@/types";

export default function LobbyPage() {
  const { user } = useAuth();
  const { status, inQueue, matchFound, joinQueue, leaveQueue } = useGame();
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!inQueue) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [inQueue]);

  useEffect(() => {
    if (matchFound) router.push(`/game?id=${matchFound.gameId}`);
  }, [matchFound, router]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}_`;

  return (
    <ProtectedLayout activeRoute="/lobby">
      <div className="p-8">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-8">

          {/* ── Hero banner ─────────────────────────────────────────── */}
          <section className="relative w-full h-[400px] overflow-hidden rounded bg-surface-container-low group">
            {/* Background glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-tertiary/5" />

            <div className="absolute bottom-10 left-10 right-10 flex flex-col items-start gap-4 z-20">
              <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold tracking-[0.3em] uppercase rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Now: Sector 7 Championship
              </span>

              <h1 className="font-headline text-7xl font-bold tracking-tighter uppercase text-white leading-none">
                READY_FOR <br />
                <span className="text-primary italic">DEPLOYMENT</span>
              </h1>

              <div className="mt-8 flex gap-4 w-full md:w-auto">
                {!inQueue ? (
                  <button
                    onClick={() => joinQueue("ranked" as GameMode)}
                    disabled={status !== "connected"}
                    className="px-10 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-black text-lg tracking-tighter font-headline flex items-center gap-4 transition-all hover:shadow-[0_0_30px_rgba(0,238,252,0.4)] active:scale-95 disabled:opacity-50"
                  >
                    FIND MATCH
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </button>
                ) : (
                  <button
                    onClick={leaveQueue}
                    className="px-10 py-5 bg-error/20 border border-error/40 text-error font-black text-lg tracking-tighter font-headline flex items-center gap-4 transition-all hover:bg-error/30 active:scale-95"
                  >
                    CANCEL SEARCH
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
                <div className="px-6 py-5 bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-center">
                  <span className="text-[10px] text-on-surface-variant font-bold tracking-[0.2em] uppercase">
                    {inQueue ? "Queue Time" : "Avg Queue"}
                  </span>
                  <span className="font-headline text-xl font-bold text-white tracking-widest">
                    {inQueue ? fmt(elapsed) : "02:45_"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mode card ─────────────────────────────────────────────── */}
          <div className="bg-surface-container-low p-8 relative overflow-hidden group cursor-pointer hover:bg-surface-container-high transition-colors">
            <div className="absolute top-0 right-0 p-8 flex gap-4">
              <span className="material-symbols-outlined text-primary">stars</span>
              <span className="material-symbols-outlined text-secondary">rocket_launch</span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-[0.4em] text-primary mb-2 uppercase">
                  Protocol_Unified_Nexus
                </div>
                <h3 className="font-headline text-4xl font-bold text-white uppercase mb-4">
                  Find Match
                </h3>
                <p className="text-on-surface-variant text-base font-medium leading-relaxed max-w-2xl">
                  Initialize core combat protocols. System will automatically match you based on skill level and region
                  availability. Experience gains and rank adjustments enabled for all sessions.
                </p>
              </div>

              {user && (
                <div className="w-full md:w-72 shrink-0">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Level Progress</span>
                    <span className="text-[10px] font-bold text-on-surface tracking-widest">LVL {user.level}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest overflow-hidden rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_8px_#8ff5ff] transition-all duration-700"
                      style={{ width: `${(user.xp % 1000) / 10}%` }}
                    />
                  </div>
                  <div className="mt-4 text-[9px] text-on-surface-variant/60 font-bold tracking-widest uppercase text-right italic">
                    Authentication Status: Verified
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Player stats row ──────────────────────────────────────── */}
          {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "GLOBAL_RANK", value: `#${user.rank}`, color: "text-primary" },
                { label: "WINS",        value: user.wins,        color: "text-secondary" },
                { label: "LOSSES",      value: user.losses,      color: "text-on-surface-variant" },
                { label: "WIN_RATE",    value: user.wins + user.losses > 0 ? `${Math.round(user.wins/(user.wins+user.losses)*100)}%` : "—", color: "text-tertiary" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-container-low p-6">
                  <div className={`font-headline text-4xl font-black tracking-tighter ${color}`}>{value}</div>
                  <div className="text-[10px] font-label text-on-surface-variant tracking-widest uppercase mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0e0e13]/80 backdrop-blur-xl md:hidden flex justify-around items-center py-4 z-50">
        <div className="flex flex-col items-center gap-1 text-violet-400">
          <span className="material-symbols-outlined">sports_esports</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Lobby</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Ranking</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,238,252,0.5)]">
            <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">person_search</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Profile</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-500">
          <span className="material-symbols-outlined">forum</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Chat</span>
        </div>
      </nav>
    </ProtectedLayout>
  );
}
