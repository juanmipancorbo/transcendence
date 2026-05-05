"use client";

import BoardCell from "./BoardCell";
import type { Board, PlayerColor } from "@/types";

interface GameBoardProps {
  board: Board;
  validMoves: Array<[number, number]>;
  currentTurn: PlayerColor;
  myColor: PlayerColor;
  onMove: (row: number, col: number) => void;
}

export default function GameBoard({ board, validMoves, currentTurn, myColor, onMove }: GameBoardProps) {
  const validSet = new Set(validMoves.map(([r, c]) => `${r},${c}`));
  const isMyTurn = currentTurn === myColor;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Column labels */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `24px repeat(8, 1fr)`, width: "100%" }}>
        <div />
        {"ABCDEFGH".split("").map(l => (
          <div key={l} className="flex items-center justify-center font-body text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
            {l}
          </div>
        ))}
      </div>

      {/* Board rows */}
      <div className="w-full" style={{ aspectRatio: "1 / 1" }}>
        {board.map((row, r) => (
          <div key={r} className="flex items-center gap-0.5 mb-0.5">
            {/* Row label */}
            <div className="w-6 flex-shrink-0 flex items-center justify-center font-body text-label-sm" style={{ color: "var(--on-surface-variant)" }}>
              {r + 1}
            </div>
            {/* Cells */}
            <div className="grid gap-0.5 flex-1" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
              {row.map((cell, c) => (
                <BoardCell
                  key={c}
                  row={r}
                  col={c}
                  state={cell}
                  isValidMove={validSet.has(`${r},${c}`)}
                  isMyTurn={isMyTurn}
                  onClick={onMove}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
