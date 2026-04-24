"use client";

/**
 * Returns a static mid-game board state so the game page renders.
 * TODO :
 *   - Connect GameSocket to the real server
 *   - Replace mockGameState with live state
 *   - joinQueue / leaveQueue / makeMove to socket.send()
 */

import { useState } from "react";
import type { GameState, GameMode } from "@/types";
import { MOCK_USER } from "@/lib/api";

const MOCK_OPPONENT = { id: "2", username: "v_specter", avatarUrl: undefined };

const EMPTY_BOARD = Array(8).fill(null).map(() => Array(8).fill("empty")) as GameState["board"];

const MOCK_BOARD: GameState["board"] = EMPTY_BOARD.map((row, r) =>
  row.map((_, c) => {
    if ((r === 3 && c === 3) || (r === 4 && c === 4)) return "white";
    if ((r === 3 && c === 4) || (r === 4 && c === 3)) return "black";
    return "empty";
  })
);

const MOCK_GAME_STATE: GameState = {
  id:          "mock-game-1",
  board:       MOCK_BOARD,
  currentTurn: "black",
  status:      "in-progress",
  scores:      { black: 2, white: 2 },
  validMoves:  [[2,3],[3,2],[4,5],[5,4]],
  players: {
    black: { id: MOCK_USER.id, username: MOCK_USER.username, avatarUrl: undefined },
    white: MOCK_OPPONENT,
  },
};

export function useGame() {
  const [inQueue,    setInQueue]    = useState(false);
  const [gameState,  setGameState]  = useState<GameState | null>(null);

  // TODO: replace with real socket events
  const joinQueue = (_mode: GameMode) => {
    setInQueue(true);
    // Simulate finding a match after 2s for demo purposes
    setTimeout(() => {
      setInQueue(false);
      setGameState(MOCK_GAME_STATE);
    }, 2000);
  };

  const leaveQueue = () => setInQueue(false);

  const makeMove = (row: number, col: number) => {
    // TODO: socket.send("make_move", { row, col })
    console.log("[useGame] move stub →", row, col);
  };

  return {
    status:     "connected" as const,  // always "connected" in mock
    gameState,
    matchFound: null,
    inQueue,
    joinQueue,
    leaveQueue,
    makeMove,
  };
}
