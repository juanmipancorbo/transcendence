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
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus;
  xp: number;
  level: number;
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

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

export type CellState = 0 | 1 | 2;
export type PlayerColor = 1 | 2;

export type GameStatus =
	| 'WAITING'
	| 'ACTIVE'
	| 'FINISHED'
	| 'ABANDONED';

export interface GameCell {
  row: number;
  col: number;
  state: CellState;
}

export type Board = CellState[][];  // 8×8

export interface GameState {
  id: string;
  board: Board;
  currentTurn: PlayerColor | null;
  status: GameStatus;
  scores: { black: number; white: number };
  validMoves: Array<[number, number]>;
  players: {
    black: string;
    white: string;
  };
  allowSpectators: boolean;
  timeLimit: number;
  winner?: PlayerColor | 0; // 0 = draw
  startedAt?: number;
  endedAt?: number;
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
export enum PreGameProtocol {
	Error = 0,
	MatchFound = 1,
	MatchmakeError = 2
}

export enum Protocol {
	KeepAlive = 0,
	ConsumeTurn = 1,
	Ready = 2,
	ChatMessage = 3,
	SpectatorJoin = 4,
	SpectatorLeave = 5,
	YourTurn = 6,
	OpponentTurn = 7,
	NoMoves = 8,
	OpponentNoMoves = 9,
	PlayerAbandon = 10,
	OpponentAbandon = 11,
	Board = 12,
	State = 13,
	MoveUpdate = 14,
	GameStart = 15,
	GameEnd = 16,
	Error = 17
};
