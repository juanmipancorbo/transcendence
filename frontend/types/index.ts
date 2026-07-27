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
	bio: string,
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

export type PublicUser = Pick<User, "id" | "username" | "avatarUrl" | "bio" | "status" | "currentGame" | "createdAt" | "gamesPlayed" | "gamesWon" | "gamesLost" | "xp" | "level">;

// A single message in a 1-to-1 chat (mirrors the backend ChatMessage).
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface UnreadChat {
  friendId: string;
  count: number;
}

export type SChatMessage = Pick<ChatMessage, "senderId" | "content" | "createdAt">;

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

export type Winner = 1 | 2 | 'DRAW' | null;

export type GameData = {
  gameId: string,
  whiteId: string,
  blackId: string,
  timeLimitBlack: number,
  timeLimitWhite: number,
  allowSpectators: number,
  friendly: number,
  winner: Winner,
};

export type CompletedGameData = {
  gameId: string;
  whiteId: string;
  blackId: string;
  winner: PlayerColor | 0;
  board: Board;
  scores: { black: number; white: number };
  finishedAt: string;
};

export type Move = {
	row: number;
	col: number;
	player: number;
};

export type FullGame = {
	id: string;
	white_player_id: string;
	black_player_id: string;
	time_left_white: number;
	time_left_black: number;
	friendly: boolean;
	allow_spectators: boolean;
	moves: Move[];
	winner_id: string | null;
	created_at: string;
	finished_at: string | null;
};

export type RecreatedGame = FullGame & {
	steps: Board[];
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

export interface DuelRequest {
	from: string,
	allowSpectators: boolean,
	secsLimit: number,
}

// ─── WebSocket protocol (mirrors backend protocol.ts) ────────────────────────

export enum GlobalProtocol {
	KeepAlive = 0,
	JoinCasualQueue = 1,
	LeaveQueue = 2,
	FriendReqSend = 3,
	FriendReqReject = 4,
	FriendReqAccept = 5,
	Chat = 6,
	JoinGame = 7,
	MatchFound = 8,
	DuelRequest = 9,
	DuelAccept = 10,
	Info = 11,
	Error = 12,
	Notification = 13,
	DuelReject = 14
}

export enum ProtocolCodes {
	Generic = 0,
	FriendReqFailed = 1,
	QueueFailed = 2,
	DuelRequestFailed = 3,
}

export enum Protocol {
	KeepAlive = 0,
	ConsumeTurn = 1,
	Ready = 2,
	ChatMessage = 3,
	SpectatorJoin = 4,
	SpectatorLeave = 5,
	BlackTurn = 6,
	WhiteTurn = 7,
	BlackNoMoves = 8,
	WhiteNoMoves = 9,
	BlackAbandon = 10,
	WhiteAbandon = 11,
	BlackDisconnect = 12,
	WhiteDisconnect = 13,
	BlackReconnect = 14,
	WhiteReconnect = 15,
	Abandon = 16,
	Disconnect = 17,
	Board = 18,
	State = 19,
	MoveUpdate = 20,
	GameStart = 21,
	GameEnd = 22,
	XpUpdate = 23,
	Error = 24,
	FatalError = 25
};
