"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { leaderboardApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { LeaderboardEntry } from "@/types";

const RANK_TIERS = [
  { min: 1,   max: 1,   label: "LEGENDARY",   color: "text-primary",          bg: "bg-primary/10",          text: "text-primary" },
  { min: 2,   max: 3,   label: "GRANDMASTER", color: "text-on-surface-variant", bg: "bg-surface-variant",  text: "text-on-surface-variant" },
  { min: 4,   max: 10,  label: "MASTER",      color: "text-secondary",          bg: "bg-secondary/10",     text: "text-secondary" },
  { min: 11,  max: 999, label: "ELITE",       color: "text-on-surface-variant", bg: "bg-surface-variant",  text: "text-on-surface-variant" },
];

function getTier(rank: number) {
  return RANK_TIERS.find(t => rank >= t.min && rank <= t.max) ?? RANK_TIERS[3];
}

export default function LeaderboardPage() {
  const { user: me } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.getTop(50)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout activeRoute="/leaderboard">
      <main className="px-12 py-10 max-w-screen-2xl">
        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12">

            {/* ── Header ───────────────────────────────────────────── */}
            <div className="mb-12 flex items-end gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-headline font-bold tracking-[0.4em] text-primary uppercase mb-2">
                  Global_Rankings
                </span>
                <h1 className="text-6xl font-headline font-black tracking-tighter text-on-surface italic">
                  LEADERBOARD
                </h1>
              </div>
              <div className="mb-2 bg-surface-container-high px-4 py-2 rounded flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Live</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <span className="font-headline font-black text-3xl italic tracking-widest text-violet-500 animate-pulse">
                  LOADING…
                </span>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">

                {/* Column headers */}
                <div className="grid grid-cols-12 px-8 py-4 bg-surface-container-low font-headline text-[10px] text-on-surface-variant font-black tracking-widest uppercase mb-4">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">Competitor</div>
                  <div className="col-span-2 text-center">Level</div>
                  <div className="col-span-2 text-center">ELO Rating</div>
                  <div className="col-span-2 text-right">Win Rate</div>
                </div>

                {/* Rows */}
                {entries.map((entry, i) => {
                  const tier = getTier(entry.rank);
                  const isMe = entry.user.id === me?.id;
                  const winRate = entry.winRate;
                  const rankStr = String(entry.rank).padStart(2, "0");

                  return (
                    <div
                      key={entry.user.id}
                      className={`grid grid-cols-12 px-8 py-6 items-center transition-all relative ${
                        isMe
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      {/* "You" left accent bar */}
                      {isMe && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}

                      {/* Rank */}
                      <div className={`col-span-1 font-headline text-2xl font-bold ${entry.rank === 1 ? "text-primary" : "text-on-surface-variant"}`}>
                        {rankStr}
                      </div>

                      {/* Competitor */}
                      <div className="col-span-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-variant rounded-lg flex items-center justify-center font-headline font-black text-lg text-on-surface-variant flex-shrink-0">
                          {entry.user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-headline font-bold text-on-surface text-sm">
                            {entry.user.displayName}
                          </p>
                          <span className={`text-[10px] ${tier.bg} ${tier.text} px-2 py-0.5 rounded font-black tracking-widest`}>
                            {isMe ? "YOUR CURRENT RANK" : tier.label}
                          </span>
                        </div>
                      </div>

                      {/* Level */}
                      <div className="col-span-2 text-center font-headline font-bold text-on-surface">
                        {/* TODO: expose level from API */}—
                      </div>

                      {/* ELO */}
                      <div className="col-span-2 text-center">
                        <span className={`font-headline font-bold ${entry.rank === 1 ? "text-primary" : "text-on-surface"}`}>
                          {entry.xp.toLocaleString()}
                        </span>
                      </div>

                      {/* Win rate */}
                      <div className="col-span-2 text-right">
                        <div className="w-full bg-surface-container-low h-1 mb-1">
                          <div
                            className="bg-primary h-full shadow-[0_0_8px_#8ff5ff]"
                            style={{ width: `${Math.min(winRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">{winRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}

                {entries.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="font-headline font-bold text-on-surface-variant tracking-widest uppercase">
                      No competitors yet. Initialize the first match.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
      </div>
    </ProtectedLayout>
  );
}
