"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { MOCK_USER } from "@/lib/api";
import type { GameState, PlayerColor } from "@/types";

//    Static mock game state (start of a game)                               
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

  const [board, setBoard]   = useState<GameState["board"]>(INITIAL_BOARD);
  const [scores, setScores] = useState({ black: 2, white: 2 });
  const [turn, setTurn]     = useState<PlayerColor>("black");
  const [validMoves, setValidMoves] = useState<Array<[number,number]>>(INITIAL_VALID);
  const [finished, setFinished]     = useState(false);

  const validSet  = new Set(validMoves.map(([r, c]) => `${r},${c}`));
  const isMyTurn  = turn === myColor;

  function handleMove(r: number, c: number) {
    if (!validSet.has(`${r},${c}`) || !isMyTurn || finished) return;
    // TODO: replace with real game logic or backend response
    const next = board.map(row => [...row]) as GameState["board"];
    next[r][c] = myColor;
    setBoard(next);
    setScores(s => ({ ...s, [myColor]: s[myColor] + 1 }));
    setValidMoves([]);   // clear until backend responds with new valid moves
    setTurn("white");

    // Simulate opponent move after 1s
    setTimeout(() => {
      setTurn("black");
      setValidMoves(INITIAL_VALID);
    }, 1000);
  }

  return (
    <ProtectedLayout activeRoute="/game">
      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-100px)]">

        {/*    My panel                                                   */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-2 md:order-1">
          <PlayerPanel
            name={MOCK_USER.username}
            label="PLAYER_01"
            score={scores[myColor]}
            total={64}
            accent="border-primary"
            scoreColor="text-primary"
            glowColor="#8ff5ff"
            isMyTurn={isMyTurn && !finished}
          />
          <div className="bg-surface-container-low p-6 rounded-lg">
            <div className="text-on-surface-variant text-[10px] font-black tracking-widest uppercase mb-4">Match_Log</div>
            <p className="text-xs text-on-surface-variant italic">Moves will appear here…</p>
          </div>
        </aside>

        {/*    Board                                                      */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 order-1 md:order-2">
          {/* Turn banner */}
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-headline font-bold text-primary tracking-tighter text-sm">
              {finished ? "GAME OVER" : isMyTurn ? "YOUR_TURN" : `${MOCK_OPPONENT.username.toUpperCase()}_MOVING…`}
            </span>
          </div>

          {/* Grid */}
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative bg-surface-container-high p-4 rounded-xl shadow-2xl">
              <div className="grid grid-cols-8 gap-[2px] bg-surface-container-highest p-[2px]">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = validSet.has(key) && isMyTurn && !finished;
                    return (
                      <div
                        key={key}
                        onClick={() => handleMove(r, c)}
                        className={`w-12 h-12 md:w-14 md:h-14 bg-surface-container-low flex items-center justify-center transition-all ${isValid ? "cursor-pointer hover:bg-surface-container-high" : ""}`}
                      >
                        {cell === "black" && (
                          <div className="w-3/4 h-3/4 rounded-full bg-on-surface shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
                        )}
                        {cell === "white" && (
                          <div className="w-3/4 h-3/4 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,238,252,0.4)]" />
                        )}
                        {cell === "empty" && isValid && (
                          <div className="w-1/3 h-1/3 rounded-full bg-primary/30 border border-primary/40" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/lobby")}
              className="px-6 py-3 bg-surface-container-high border border-outline-variant hover:border-error text-on-surface-variant hover:text-error transition-all font-headline text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              {finished ? "Back to Lobby" : "Resign"}
            </button>
            <button
              onClick={() => setFinished(true)}
              className="px-6 py-3 bg-surface-container-high border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all font-headline text-xs font-bold tracking-widest uppercase flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
              End (Demo)
            </button>
          </div>
        </section>

        {/*    Opponent panel                                              */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={MOCK_OPPONENT.username}
            label="PLAYER_02"
            score={scores["white"]}
            total={64}
            accent="border-tertiary"
            scoreColor="text-tertiary"
            glowColor="#d575ff"
            isMyTurn={!isMyTurn && !finished}
          />
        </aside>
      </main>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 rounded-full blur-[120px]" />
      </div>
    </ProtectedLayout>
  );
}

function PlayerPanel({ name, label, score, total, accent, scoreColor, glowColor, isMyTurn }: {
  name: string; label: string; score: number; total: number;
  accent: string; scoreColor: string; glowColor: string; isMyTurn: boolean;
}) {
  return (
    <div className={`bg-surface-container-low p-6 rounded-lg flex flex-col items-center gap-4 border-l-4 ${accent}`}>
      <div className="relative">
        <div className={`w-24 h-24 rounded-full border-2 p-1 flex items-center justify-center bg-surface-container-highest`}
             style={{ borderColor: glowColor }}>
          <span className={`font-headline font-black text-3xl ${scoreColor}`}>
            {name[0].toUpperCase()}
          </span>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap text-on-primary-fixed"
             style={{ background: glowColor }}>
          {label}
        </div>
      </div>
      <div className="text-center mt-2">
        <div className={`${scoreColor} font-headline text-5xl font-black tracking-tighter`}>{score}</div>
        <div className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Captured_Cells</div>
      </div>
      <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${(score / total) * 100}%`, background: glowColor, boxShadow: `0 0 10px ${glowColor}` }} />
      </div>
      {isMyTurn && (
        <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full flex items-center gap-2"
              style={{ background: `${glowColor}20`, color: glowColor }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: glowColor }} />
          ACTIVE
        </span>
      )}
    </div>
  );
}
