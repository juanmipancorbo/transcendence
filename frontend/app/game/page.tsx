"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useGame } from "@/hooks/useGame";
import { useAuth } from "@/hooks/useAuth";
import type { PlayerColor } from "@/types";

export default function GamePage() {
  return (
    <ProtectedLayout activeRoute="/game">
      <Suspense fallback={<Loading />}>
        <GameContent />
      </Suspense>
    </ProtectedLayout>
  );
}

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { gameState, makeMove } = useGame();

  if (!gameState) return <Loading />;

  const myColor: PlayerColor = gameState.players.black.id === user?.id ? "black" : "white";
  const isMyTurn = gameState.currentTurn === myColor;
  const opponent = myColor === "black" ? gameState.players.white : gameState.players.black;
  const isFinished = gameState.status === "finished";
  const validSet = new Set(gameState.validMoves.map(([r, c]) => `${r},${c}`));

  return (
    <main className="max-w-screen-2xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-100px)]">

      {/* ── Player 1 panel (my side) ─────────────────────────────────── */}
      <aside className="w-full md:w-72 flex flex-col gap-6 order-2 md:order-1">
        <div className="bg-surface-container-low p-6 rounded-lg flex flex-col items-center gap-4 border-l-4 border-primary"
             style={{ boxShadow: "20px 0 60px -15px rgba(40,0,103,0.1)" }}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-primary p-1 flex items-center justify-center bg-surface-container-highest">
              <span className="font-headline font-black text-3xl text-primary">
                {(user?.username[0] ?? "?").toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap">
              PLAYER_01
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-primary font-headline text-5xl font-black tracking-tighter">
              {gameState.scores[myColor]}
            </div>
            <div className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Captured_Cells</div>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full shadow-[0_0_10px_#8ff5ff]"
                 style={{ width: `${(gameState.scores[myColor] / 64) * 100}%` }} />
          </div>
          {isMyTurn && !isFinished && (
            <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> YOUR TURN
            </span>
          )}
        </div>

        {/* Move log */}
        <div className="bg-surface-container-low p-6 rounded-lg flex flex-col gap-4">
          <div className="text-on-surface-variant text-[10px] font-black tracking-widest uppercase mb-2">Match_Log</div>
          <div className="flex flex-col gap-3 text-xs text-on-surface-variant">
            <p className="italic">Moves appear here…</p>
          </div>
        </div>
      </aside>

      {/* ── Board center ─────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center gap-8 order-1 md:order-2">
        {/* Turn status */}
        <div className="flex items-center gap-12 w-full justify-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-on-surface-variant mb-2">Current_Turn</span>
            <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="font-headline font-bold text-primary tracking-tighter">
                {isFinished
                  ? gameState.winner === myColor ? "VICTORY" : gameState.winner === "draw" ? "DRAW" : "DEFEAT"
                  : isMyTurn ? "YOUR_TURN" : `${opponent.username.toUpperCase()}_MOVING`}
              </span>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative bg-surface-container-high p-4 rounded-xl shadow-2xl">
            <div className="reversi-grid bg-[#0a0a0f] gap-[2px] p-[2px] border-4 border-surface-container-highest shadow-inner">
              {gameState.board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const isValid = validSet.has(key) && isMyTurn && !isFinished;
                  return (
                    <div
                      key={key}
                      onClick={() => isValid && makeMove(r, c)}
                      className={`w-12 h-12 md:w-16 md:h-16 bg-surface-container-low flex items-center justify-center transition-all ${isValid ? "cursor-pointer hover:bg-surface-container-high" : ""}`}
                    >
                      {cell === "black" && (
                        <div className="w-3/4 h-3/4 rounded-full bg-on-surface shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                      )}
                      {cell === "white" && (
                        <div className="w-3/4 h-3/4 rounded-full bg-primary-container shadow-[0_0_15px_rgba(0,238,252,0.4)]" />
                      )}
                      {cell === "empty" && isValid && (
                        <div className="w-3/4 h-3/4 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary/40" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full max-w-lg">
          <button
            onClick={() => router.push("/lobby")}
            className="flex-1 py-4 px-6 bg-surface-container-high border border-outline-variant hover:border-error transition-all group flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-error">close</span>
            <span className="font-headline font-bold text-xs tracking-widest text-on-surface-variant group-hover:text-error uppercase">
              {isFinished ? "Back_Lobby" : "Resign"}
            </span>
          </button>
          {!isFinished && (
            <>
              <button className="flex-1 py-4 px-6 bg-surface-container-high border border-outline-variant hover:border-primary transition-all group flex items-center justify-center gap-3 active:scale-95">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">handshake</span>
                <span className="font-headline font-bold text-xs tracking-widest text-on-surface-variant group-hover:text-primary uppercase">Offer_Draw</span>
              </button>
              <button className="flex-1 py-4 px-6 bg-surface-container-high border border-outline-variant hover:border-secondary transition-all group flex items-center justify-center gap-3 active:scale-95">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">history</span>
                <span className="font-headline font-bold text-xs tracking-widest text-on-surface-variant group-hover:text-secondary uppercase">Analysis</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Opponent panel (right) ────────────────────────────────────── */}
      <aside className="w-full md:w-72 flex flex-col gap-6 order-3">
        <div className="bg-surface-container-low p-6 rounded-lg flex flex-col items-center gap-4 border-r-4 border-tertiary"
             style={{ boxShadow: "20px 0 60px -15px rgba(40,0,103,0.1)" }}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-tertiary p-1 flex items-center justify-center bg-surface-container-highest">
              <span className="font-headline font-black text-3xl text-tertiary">
                {opponent.username[0].toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-tertiary text-on-tertiary text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap">
              PLAYER_02
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-tertiary font-headline text-5xl font-black tracking-tighter">
              {gameState.scores[myColor === "black" ? "white" : "black"]}
            </div>
            <div className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Captured_Cells</div>
          </div>
          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full shadow-[0_0_10px_#d575ff]"
                 style={{ width: `${(gameState.scores[myColor === "black" ? "white" : "black"] / 64) * 100}%` }} />
          </div>
        </div>
      </aside>

      {/* Ambient background */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 rounded-full blur-[120px]" />
      </div>
    </main>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="font-headline font-black text-5xl italic tracking-widest text-violet-500 animate-pulse">
        LOADING…
      </span>
    </div>
  );
}
