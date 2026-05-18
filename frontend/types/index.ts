// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserStatus = "online" | "offline" | "in-game";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  xp: number;
  level: number;
  rank: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "status">;
  wins: number;
  losses: number;
  xp: number;
  winRate: number;
}

// ─── Game ────────────────────────────────────────────────────────────────────

export type CellState = "empty" | "black" | "white";
export type PlayerColor = "black" | "white";

export type GameStatus =
  | "waiting"
  | "in-progress"
  | "finished"
  | "abandoned";

export interface GameCell {
  row: number;
  col: number;
  state: CellState;
}

export type Board = CellState[][];  // 8×8

export interface GameState {
  id: string;
  board: Board;
  currentTurn: PlayerColor;
  status: GameStatus;
  scores: { black: number; white: number };
  validMoves: Array<[number, number]>;
  players: {
    black: Pick<User, "id" | "username" | "avatarUrl">;
    white: Pick<User, "id" | "username" | "avatarUrl">;
  };
  winner?: PlayerColor | "draw";
  startedAt?: string;
  endedAt?: string;
}

// ─── Lobby / Matchmaking ─────────────────────────────────────────────────────

export type GameMode = "ranked" | "casual" | "private";

export interface LobbyPlayer {
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "status" | "rank">;
  gameMode: GameMode;
  queuedAt: string;
}

export interface MatchFoundPayload {
  gameId: string;
  opponent: Pick<User, "id" | "username" | "avatarUrl" | "rank">;
  playerColor: PlayerColor;
}

// ─── WebSocket protocol (mirrors backend protocol.ts) ────────────────────────

export type WSMessageType =
  | "join_queue"
  | "leave_queue"
  | "match_found"
  | "game_start"
  | "make_move"
  | "move_result"
  | "game_over"
  | "opponent_disconnected"
  | "ping"
  | "pong";

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload?: T;
  timestamp: number;
}
