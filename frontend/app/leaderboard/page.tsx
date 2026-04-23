"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.getTop(50)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-slide-up">
          <p className="font-body text-label-sm uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>
            Global
          </p>
          <h1 className="font-display font-bold text-display-md" style={{ color: "var(--on-surface)" }}>
            Rankings
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="font-body text-sm animate-pulse" style={{ color: "var(--on-surface-variant)" }}>
              Loading rankings…
            </span>
          </div>
        ) : (
          <div className="animate-slide-up delay-100">
            {/* Column headers */}
            <div
              className="grid grid-cols-[40px_1fr_80px_80px_80px] gap-4 px-5 py-2 mb-1"
            >
              {["#", "PLAYER", "WINS", "LOSSES", "WIN%"].map(h => (
                <span key={h} className="font-body text-label-sm uppercase tracking-widest text-right first:text-left" style={{ color: "var(--on-surface-variant)" }}>
                  {h}
                </span>
              ))}
            </div>

            {entries.map((entry, i) => (
              <LeaderboardRow key={entry.user.id} entry={entry} index={i} />
            ))}

            {entries.length === 0 && (
              <p className="text-center py-16 font-body text-sm" style={{ color: "var(--on-surface-variant)" }}>
                No players yet. Be the first to play!
              </p>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const { rank, user, wins, losses, winRate } = entry;
  const isTop3 = rank <= 3;
  const rankColors = ["var(--primary)", "var(--secondary)", "var(--tertiary)"];

  return (
    <div
      className="grid grid-cols-[40px_1fr_80px_80px_80px] gap-4 px-5 py-4 rounded transition-colors"
      style={{
        background: index % 2 === 0 ? "var(--surface)" : "var(--surface-container-low)",
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Rank */}
      <span
        className="font-display font-bold text-headline-sm self-center"
        style={{ color: isTop3 ? rankColors[rank - 1] : "var(--on-surface-variant)" }}
      >
        {rank}
      </span>

      {/* Player */}
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-xs"
          style={{ background: "var(--surface-container-highest)", color: "var(--on-surface-variant)" }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <p className="font-body font-semibold text-sm" style={{ color: "var(--on-surface)" }}>
            {user.displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1 h-1 rounded-full"
              style={{
                background: user.status === "online" ? "var(--primary)" : user.status === "in-game" ? "var(--tertiary)" : "var(--on-surface-variant)",
              }}
            />
            <span className="font-body text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
              {user.status === "in-game" ? "In game" : user.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <span className="font-body font-semibold text-sm text-right self-center" style={{ color: "var(--on-surface)" }}>{wins}</span>
      <span className="font-body font-semibold text-sm text-right self-center" style={{ color: "var(--on-surface-variant)" }}>{losses}</span>
      <span className="font-body font-semibold text-sm text-right self-center" style={{ color: isTop3 ? rankColors[rank - 1] : "var(--on-surface)" }}>
        {winRate.toFixed(0)}%
      </span>
    </div>
  );
}
