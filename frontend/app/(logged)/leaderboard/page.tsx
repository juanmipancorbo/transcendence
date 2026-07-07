"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    function fetchLeaderboard() {
      leaderboardApi.getTop()
        .then(data => { setEntries(data); setFetchError(null); })
        .catch(e => { console.error("[leaderboard] fetch failed:", e); setFetchError(e?.message ?? "Unknown error"); })
        .finally(() => setLoading(false));
    }
    fetchLeaderboard();
    window.addEventListener("focus", fetchLeaderboard);
    return () => window.removeEventListener("focus", fetchLeaderboard);
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

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : fetchError ? (
          <p className="text-center text-red-400 italic py-24">Failed to load: {fetchError}</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-on-surface-variant italic py-24">No data yet.</p>
        ) : (
          <>
            {/* Column headers */}
            <div className="lb-header-row">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Competitor</div>
              <div className="col-span-2 text-right">XP</div>
              <div className="col-span-2 text-center">Wins</div>
              <div className="col-span-1 text-center">Losses</div>
              <div className="col-span-2 text-right">Win Rate</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col space-y-2">
              {entries.map((entry, i) => {
                const isMe      = entry.user.id === user?.id;
                const rankColor = entry.rank === 1 ? "text-primary"
                                : entry.rank <= 3  ? "text-secondary"
                                :                    "text-on-surface-variant";

                const statusColor = entry.user.status === "online" ? "#8ff5ff"
                                  : entry.user.status === "busy"   ? "#d575ff"
                                  :                                   "#76747b";

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
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="lb-avatar overflow-hidden">
                        {entry.user.avatarUrl ? (
                          <img src={entry.user.avatarUrl} alt={entry.user.username} className="w-full h-full object-cover" />
                        ) : (
                          entry.user.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-headline font-bold text-on-surface text-sm">{entry.user.username}</p>
                          <span className="lb-level-badge">Lvl.{entry.user.level}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                          <span className="label-micro">
                            {entry.user.status === "busy" ? "In game" : entry.user.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="col-span-2 text-right font-headline font-bold text-primary text-sm">
                      {entry.xp.toLocaleString()}
                    </div>

                    {/* Wins */}
                    <div className="col-span-2 text-center font-headline font-bold text-on-surface">
                      {entry.wins}
                    </div>

                    {/* Losses */}
                    <div className="col-span-1 text-center font-headline font-bold text-on-surface-variant">
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
          </>
        )}
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px]" />
      </div>
    </>
  );
}
