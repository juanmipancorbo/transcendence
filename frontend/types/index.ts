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

export interface User {
	id: string,
	username: string,
	email: string,
	avatarUrl?: string,
	status: "offline" | "online" | "busy",
	currentGame?: string,
	gamesPlayed: number,
	gamesWon: number,
	gamesLost: number,
	xp: number,
	level: number,
	createdAt: Date,
	updatedAt: Date
}

export type PublicUser = Pick<User, "id" | "username" | "avatarUrl" | "status" | "createdAt" | "gamesPlayed" | "gamesWon" | "gamesLost" | "xp" | "level">;

export interface LeaderboardEntry {
  rank: number;
  user: PublicUser;
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
  user: PublicUser;
  gameMode: GameMode;
  queuedAt: string;
}

export interface MatchFoundPayload {
  gameId: string;
  opponent: PublicUser;
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
	Error = 17,
	XpUpdate = 18
};
