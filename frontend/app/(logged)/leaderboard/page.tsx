"use client";

import { useEffect, useState } from "react";
import { leaderboardApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    leaderboardApi.getTop().then(setEntries).catch(() => setEntries([]));
  }, []);

  return (
    <>
      <main className="px-12 py-10 max-w-screen-2xl">

        {/* Header */}
        <div className="mb-12 flex items-end gap-6">
          <div className="flex flex-col">
            <span className="label-micro accent tracking-[0.4em] mb-2">Global_Rankings</span>
            <h1 className="text-6xl font-headline font-black tracking-tighter text-on-surface italic">
              LEADERBOARD
            </h1>
          </div>
          <div className="mb-2 live-badge">
            <span className="live-dot" />
            <span className="label-micro">Live</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="lb-header-row">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Competitor</div>
          <div className="col-span-2 text-center">Wins</div>
          <div className="col-span-2 text-center">Losses</div>
          <div className="col-span-2 text-right">Win Rate</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col space-y-2">
          {entries.map((entry, i) => {
            const isMe      = entry.user.id === user?.id;
            const rankColor = entry.rank === 1 ? "text-primary"
                            : entry.rank <= 3  ? "text-secondary"
                            :                    "text-on-surface-variant";

            const statusColor = entry.user.status === "online"  ? "#8ff5ff"
                              : entry.user.status === "busy"  ? "#d575ff"
                              :                                    "#76747b";

            return (
              <div
                key={entry.user.id}
                className={`lb-row ${isMe ? "lb-row-me" : i % 2 === 0 ? "lb-row-even" : "lb-row-odd"}`}
              >
                {isMe && <div className="lb-row-me-accent" />}

                {/* Rank */}
                <div className={`lb-rank col-span-1 ${rankColor}`}>
                  {String(entry.rank).padStart(2, "0")}
                </div>

                {/* Competitor */}
                <div className="col-span-5 flex items-center gap-4">
                  <div className="lb-avatar">{entry.user.username[0].toUpperCase()}</div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{entry.user.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                      <span className="label-micro">
                        {entry.user.status === "busy" ? "Busy" : entry.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wins */}
                <div className="col-span-2 text-center font-headline font-bold text-on-surface">
                  {entry.wins}
                </div>

                {/* Losses */}
                <div className="col-span-2 text-center font-headline font-bold text-on-surface-variant">
                  {entry.losses}
                </div>

                {/* Win rate */}
                <div className="col-span-2 text-right">
                  <div className="lb-win-bar-track">
                    <div className="lb-win-bar-fill" style={{ width: `${entry.winRate}%` }} />
                  </div>
                  <span className="label-micro">{entry.winRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px]" />
      </div>
    </>
  );
}
