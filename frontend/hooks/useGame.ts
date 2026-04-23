"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameSocket } from "@/lib/socket";
import { tokenStore } from "@/lib/api";
import type { GameState, GameMode, MatchFoundPayload } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

export function useGame() {
  const socketRef = useRef<GameSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [matchFound, setMatchFound] = useState<MatchFoundPayload | null>(null);
  const [inQueue, setInQueue] = useState(false);

  // ── Connect once on mount ────────────────────────────────────────────────
  useEffect(() => {
    const socket = new GameSocket(WS_URL, tokenStore.get);
    socketRef.current = socket;
    setStatus("connecting");

    socket.connect().then(() => {
      setStatus("connected");
    }).catch(() => {
      setStatus("disconnected");
    });

    // Event handlers
    const unsubMatchFound = socket.on<MatchFoundPayload>("match_found", (payload) => {
      setMatchFound(payload);
      setInQueue(false);
    });

    const unsubGameStart = socket.on<GameState>("game_start", (payload) => {
      setGameState(payload);
      setMatchFound(null);
    });

    const unsubMoveResult = socket.on<GameState>("move_result", (payload) => {
      setGameState(payload);
    });

    const unsubGameOver = socket.on<GameState>("game_over", (payload) => {
      setGameState(payload);
    });

    return () => {
      unsubMatchFound();
      unsubGameStart();
      unsubMoveResult();
      unsubGameOver();
      socket.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const joinQueue = useCallback((mode: GameMode) => {
    socketRef.current?.send("join_queue", { mode });
    setInQueue(true);
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.send("leave_queue");
    setInQueue(false);
  }, []);

  const makeMove = useCallback((row: number, col: number) => {
    socketRef.current?.send("make_move", { row, col });
  }, []);

  return {
    status,
    gameState,
    matchFound,
    inQueue,
    joinQueue,
    leaveQueue,
    makeMove,
  };
}
