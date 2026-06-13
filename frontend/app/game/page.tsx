"use client";

import { useRouter, useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useGame } from "@/hooks/useGame";
import { BLACK, GameState, WHITE } from "@/types";
import { useEffect } from "react";

// TODO: Implement chat, read through game.messages, which contains messages and sender uuids
// get profiles data through game.profiles map, if it returns undefined it means the profile is not loaded yet

// TODO: Maybe visualize current spectators? listed in game.spectators, their profiles also in game.profiles

// TODO: Render time left, just read game.timeLeftFormat and game.opponentTimeLeftFormat
// its already formatted as minutes:seconds and its a react state that updates itself

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const game = useGame(id ?? "", e => {
    if (e) {
      console.error(e.message);
      // TODO: Do something on error?
    }
  });

  useEffect(() => {
    if (!id)
      router.push("/"); // TODO: or something else?
  }, []);

  let username;
  let username1;
  let score;
  let score1;
  if (game.myColor === WHITE) {
    username = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
    username1 = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
	score = game.state?.scores.white ?? 0;
	score1 = game.state?.scores.black ?? 0;
  } else {
    username = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
    username1 = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
	score = game.state?.scores.black ?? 0;
	score1 = game.state?.scores.white ?? 0;
  }


  return (
    <ProtectedLayout activeRoute="/game">
      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-2 md:order-1">
          <PlayerPanel
            name={username}
            label={username.toUpperCase()}
            score={score}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#8ff5ff"
            isMyTurn={game.yourTurn}
          />
          <div className="match-log">
            <div className="match-log-title">Match_Log</div>
            <p className="text-xs text-on-surface-variant italic">Moves will appear here…</p>
          </div>
        </aside>

        {/* Board */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 order-1 md:order-2">
          {/* Turn banner */}
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-headline font-bold text-primary tracking-tighter text-sm">
              {game.state?.status === "FINISHED" ? "GAME OVER" : game.yourTurn ? "YOUR_TURN" : `${username1.toUpperCase()}_MOVING…`}
            </span>
          </div>

          {/* Grid */}
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative bg-surface-container-high p-4 rounded-xl shadow-2xl">
              <div className="grid grid-cols-8 gap-[2px] bg-surface-container-highest p-[2px]">
                {game.state && game.state.board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = game.validSet.has(key) && game.yourTurn && game.state?.status !== "FINISHED";
                    return (
                      <div
                        key={key}
                        onClick={() => game.makeMove(r, c)}
                        className={`w-12 h-12 md:w-14 md:h-14 bg-surface-container-low flex items-center justify-center transition-all ${isValid ? "cursor-pointer hover:bg-surface-container-high" : ""}`}
                      >
                        {cell === BLACK && (
                          <div className="w-3/4 h-3/4 rounded-full bg-on-surface shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
                        )}
                        {cell === WHITE && (
                          <div className="w-3/4 h-3/4 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,238,252,0.4)]" />
                        )}
                        {cell === 0 && isValid && (
                          <div className="w-1/3 h-1/3 rounded-full bg-primary/30 border border-primary/40" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => {
				if (game.state?.status !== "FINISHED")
					game.abandon();
				router.push("/lobby");
			}} className="btn-ghost danger">
              <span className="material-symbols-outlined text-sm">close</span>
              {game.state?.status === "FINISHED" ? "Back to Lobby" : "Resign"}
            </button>
            <button
              onClick={() => {/*setFinished(true)*/}}
              className="px-6 py-3 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all font-headline text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              End (Demo)
            </button>
          </div>
        </section>

        {/* Opponent panel */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={username1}
            label={username1.toUpperCase()}
            score={score1}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#d575ff"
            isMyTurn={game.opponentTurn}
          />
        </aside>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob top-[10%] left-[5%] w-96 h-96 bg-primary/5 blur-[120px]" />
        <div className="ambient-blob bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 blur-[120px]" />
      </div>
    </ProtectedLayout>
  );
}

function PlayerPanel({ name, label, score, total, accentClass, scoreColorClass, glowColor, isMyTurn }: {
  name: string; label: string; score: number; total: number;
  accentClass: string; scoreColorClass: string; glowColor: string; isMyTurn: boolean;
}) {
  return (
    <div className={`player-panel ${accentClass}`}>
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full border-2 p-1 flex items-center justify-center bg-surface-container-highest"
          style={{ borderColor: glowColor }}
        >
          <span className={`font-headline font-black text-3xl ${scoreColorClass}`}>
            {name[0].toUpperCase()}
          </span>
        </div>
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap text-on-primary-fixed"
          style={{ background: glowColor }}
        >
          {label}
        </div>
      </div>

      <div className="text-center mt-2">
        <div className={`player-score-value ${scoreColorClass}`}>{score}</div>
        <div className="player-score-label">Captured_Cells</div>
      </div>

      <div className="player-bar-track">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(score / total) * 100}%`, background: glowColor, boxShadow: `0 0 10px ${glowColor}` }}
        />
      </div>

      {isMyTurn && (
        <span
          className="player-active-badge"
          style={{ background: `${glowColor}20`, color: glowColor }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: glowColor }} />
          ACTIVE
        </span>
      )}
    </div>
  );
}
