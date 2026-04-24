"use client";

import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { MOCK_LEADERBOARD, MOCK_USER } from "@/lib/api";

export default function LeaderboardPage() {
  // TODO: replace MOCK_LEADERBOARD with leaderboardApi.getTop()
  const entries = MOCK_LEADERBOARD;

  return (
    <ProtectedLayout activeRoute="/leaderboard">
      <main className="px-12 py-10 max-w-screen-2xl">

        {/* ── Header ───────────────────────────────────────────────── */}
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

        {/* ── Column headers ────────────────────────────────────────── */}
        <div className="grid grid-cols-12 px-8 py-4 bg-surface-container-low font-headline text-[10px] text-on-surface-variant font-black tracking-widest uppercase mb-4">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Competitor</div>
          <div className="col-span-2 text-center">Wins</div>
          <div className="col-span-2 text-center">Losses</div>
          <div className="col-span-2 text-right">Win Rate</div>
        </div>

        {/* ── Rows ──────────────────────────────────────────────────── */}
        <div className="flex flex-col space-y-2">
          {entries.map((entry, i) => {
            const isMe      = entry.user.id === MOCK_USER.id;
            const rankColor = entry.rank === 1 ? "text-primary" : entry.rank <= 3 ? "text-secondary" : "text-on-surface-variant";

            return (
              <div
                key={entry.user.id}
                className={`grid grid-cols-12 px-8 py-6 items-center transition-all relative ${
                  isMe
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : i % 2 === 0 ? "bg-surface-container" : "bg-surface-container-low hover:bg-surface-container-high"
                }`}
              >
                {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                {/* Rank */}
                <div className={`col-span-1 font-headline text-2xl font-bold ${rankColor}`}>
                  {String(entry.rank).padStart(2, "0")}
                </div>

                {/* Competitor */}
                <div className="col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-variant rounded-lg flex items-center justify-center font-headline font-black text-lg text-on-surface-variant flex-shrink-0">
                    {entry.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-sm">{entry.user.displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: entry.user.status === "online" ? "var(--tw-color-primary, #8ff5ff)" : entry.user.status === "in-game" ? "#d575ff" : "#76747b" }} />
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {entry.user.status === "in-game" ? "In Game" : entry.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wins */}
                <div className="col-span-2 text-center font-headline font-bold text-on-surface">{entry.wins}</div>

                {/* Losses */}
                <div className="col-span-2 text-center font-headline font-bold text-on-surface-variant">{entry.losses}</div>

                {/* Win rate */}
                <div className="col-span-2 text-right">
                  <div className="w-full bg-surface-container-low h-1 mb-1">
                    <div className="bg-primary h-full shadow-[0_0_8px_#8ff5ff]"
                         style={{ width: `${entry.winRate}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant">{entry.winRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      </div>
    </ProtectedLayout>
  );
}
