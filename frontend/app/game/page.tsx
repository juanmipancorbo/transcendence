"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { MOCK_USER } from "@/lib/api";
import type { GameState, PlayerColor } from "@/types";

const EMPTY: GameState["board"][0][0] = "empty";
const B: GameState["board"][0][0]     = "black";
const W: GameState["board"][0][0]     = "white";

const INITIAL_BOARD: GameState["board"] = [
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,W,    B,    EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,B,    W,    EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
  [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY],
];

const INITIAL_VALID: Array<[number, number]> = [[2,3],[3,2],[4,5],[5,4]];

const MOCK_OPPONENT = { id: "2", username: "FakeDude", avatarUrl: undefined };

export default function GamePage() {
  const router = useRouter();
  const myColor: PlayerColor = "black";

  const [board,      setBoard]      = useState<GameState["board"]>(INITIAL_BOARD);
  const [scores,     setScores]     = useState({ black: 2, white: 2 });
  const [turn,       setTurn]       = useState<PlayerColor>("black");
  const [validMoves, setValidMoves] = useState<Array<[number, number]>>(INITIAL_VALID);
  const [finished,   setFinished]   = useState(false);

  const validSet = new Set(validMoves.map(([r, c]) => `${r},${c}`));
  const isMyTurn = turn === myColor;

  function handleMove(r: number, c: number) {
    if (!validSet.has(`${r},${c}`) || !isMyTurn || finished) return;
    // TODO: replace with real game logic or backend response
    const next = board.map(row => [...row]) as GameState["board"];
    next[r][c] = myColor;
    setBoard(next);
    setScores(s => ({ ...s, [myColor]: s[myColor] + 1 }));
    setValidMoves([]);
    setTurn("white");
    setTimeout(() => {
      setTurn("black");
      setValidMoves(INITIAL_VALID);
    }, 1000);
  }

  return (
    <ProtectedLayout activeRoute="/game">
      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-2 md:order-1">
          <PlayerPanel
            name={MOCK_USER.username}
            label="PLAYER_01"
            score={scores[myColor]}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#8ff5ff"
            isMyTurn={isMyTurn && !finished}
          />
          <div className="match-log">
            <div className="match-log-title">Match_Log</div>
            <p className="text-xs text-on-surface-variant italic">Moves will appear here…</p>
          </div>
        </aside>

        {/* Board */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 order-1 md:order-2">
          <div className="turn-pill">
            <div className="turn-dot" />
            <span className="turn-label">
              {finished
                ? "GAME OVER"
                : isMyTurn
                ? "YOUR_TURN"
                : `${MOCK_OPPONENT.username.toUpperCase()}_MOVING…`}
            </span>
          </div>

          <div className="board-wrapper">
            <div className="board-glow" />
            <div className="board-container">
              <div className="board-grid">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = validSet.has(key) && isMyTurn && !finished;
                    return (
                      <div
                        key={key}
                        onClick={() => handleMove(r, c)}
                        className={`board-cell ${isValid ? "board-cell-valid" : ""}`}
                      >
                        {cell === "black" && <div className="piece-black" />}
                        {cell === "white" && <div className="piece-white" />}
                        {cell === "empty" && isValid && <div className="piece-hint" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => router.push("/lobby")} className="btn-ghost danger">
              <span className="material-symbols-outlined text-sm">close</span>
              {finished ? "Back to Lobby" : "Resign"}
            </button>
            <button onClick={() => setFinished(true)} className="btn-ghost">
              <span className="material-symbols-outlined text-sm">flag</span>
              End (Demo)
            </button>
          </div>
        </section>

        {/* Opponent panel */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={MOCK_OPPONENT.username}
            label="PLAYER_02"
            score={scores["white"]}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#d575ff"
            isMyTurn={!isMyTurn && !finished}
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
