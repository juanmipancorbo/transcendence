"use client";

import { cn } from "@/lib/utils";
import type { CellState } from "@/types";

interface BoardCellProps {
  row: number;
  col: number;
  state: CellState;
  isValidMove: boolean;
  isMyTurn: boolean;
  onClick: (row: number, col: number) => void;
}

export default function BoardCell({ row, col, state, isValidMove, isMyTurn, onClick }: BoardCellProps) {
  const isLight = (row + col) % 2 === 0;

  return (
    <div
      role={isValidMove ? "button" : "cell"}
      aria-label={`Cell ${row},${col}${state !== "empty" ? ` – ${state}` : ""}${isValidMove ? " (valid move)" : ""}`}
      onClick={() => isValidMove && isMyTurn && onClick(row, col)}
      className={cn(
        "relative flex items-center justify-center transition-all duration-200",
        isValidMove && isMyTurn && "cursor-pointer group"
      )}
      style={{
        background: isLight ? "var(--surface-container)" : "var(--surface-container-low)",
        borderRadius: 4,
      }}
    >
      {/* Piece */}
      {state !== "empty" && (
        <div
          className="w-[70%] h-[70%] rounded-full transition-all duration-300"
          style={{
            background: state === "black" ? "var(--on-surface)" : "var(--gradient-primary)",
            backgroundImage: state === "white" ? "var(--gradient-primary)" : undefined,
            boxShadow: state === "white"
              ? "var(--glow-primary)"
              : "0 2px 8px rgba(0,0,0,0.6)",
          }}
        />
      )}

      {/* Valid move hint */}
      {state === "empty" && isValidMove && isMyTurn && (
        <div
          className="w-[30%] h-[30%] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ background: "var(--primary)", boxShadow: "var(--glow-primary)" }}
        />
      )}

      {/* Subtle valid move dot even before hover */}
      {state === "empty" && isValidMove && (
        <div
          className="absolute inset-0 rounded"
          style={{ background: "rgba(143,245,255,0.04)" }}
        />
      )}
    </div>
  );
}
