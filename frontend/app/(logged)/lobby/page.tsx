"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWs } from "@/hooks/useWs";
import { useGlobalRank } from "@/hooks/useGlobalRank";

const STARTING_PIECES: Record<number, "light" | "dark"> = {
  27: "light",
  28: "dark",
  35: "dark",
  36: "light",
};

export default function LobbyPage() {
  const { user, refreshUser } = useAuth();
  const { inQueue, joinQueue, leaveQueue } = useWs();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!inQueue) { setElapsed(0); return; }
    const timer = setInterval(() => setElapsed(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [inQueue]);

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const xpProgress = user ? (user.xp % 1000) / 10 : 0;
  const globalRank = useGlobalRank(user?.id);
  const totalGames = (user?.gamesWon ?? 0) + (user?.gamesLost ?? 0);
  const winRate = totalGames > 0 ? Math.round(((user?.gamesWon ?? 0) / totalGames) * 100) : 0;

  return (
    <main className="retro-lobby">
      <div className="retro-lobby-inner">
        <section className="retro-hero">
          <div className="retro-hero-copy">
            <p className="retro-kicker">Online Reversi Club</p>
            <h1>REVERSI</h1>
            <p className="retro-subtitle">A quiet game of strategy. Claim the board, one move at a time.</p>

            <div className="retro-queue-actions">
              {!inQueue ? (
                <button onClick={joinQueue} className="retro-primary-button">Find opponent</button>
              ) : (
                <button onClick={leaveQueue} className="retro-secondary-button">Cancel search</button>
              )}
              <div className="retro-timer" aria-live="polite">
                <span>{inQueue ? "Searching" : "Matchmaking"}</span>
                <strong>{inQueue ? formatTime(elapsed) : "Ready"}</strong>
              </div>
            </div>
          </div>

          <div className="retro-board-wrap" aria-label="Reversi starting position">
            <div className="retro-board">
              {Array.from({ length: 64 }, (_, index) => (
                <div key={index} className="retro-square">
                  {STARTING_PIECES[index] && <span className={`retro-piece ${STARTING_PIECES[index]}`} />}
                </div>
              ))}
            </div>
            <p>8 x 8 / classic rules</p>
          </div>
        </section>

        <section className="retro-match-strip">
          <div>
            <p className="retro-section-label">Quick match</p>
            <h2>Play another person online</h2>
            <p>You will be paired with the next available player. Results count toward your rank and experience.</p>
          </div>
          <div className="retro-level">
            <div><span>Level progress</span><strong>LVL {user?.level ?? 0}</strong></div>
            <div className="retro-progress"><span style={{ width: `${xpProgress}%` }} /></div>
          </div>
        </section>

        <section className="retro-stats" aria-label="Player statistics">
          {[
            { label: "Global rank", value: globalRank ? `#${globalRank}` : "#--" },
            { label: "Wins", value: user?.gamesWon ?? 0 },
            { label: "Losses", value: user?.gamesLost ?? 0 },
            { label: "Win rate", value: `${winRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="retro-stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
