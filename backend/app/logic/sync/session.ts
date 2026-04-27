import { randomUUID, UUID } from "crypto";
import { createInitialGameState, GameState, Player, Position } from "../game";

export const SESSIONS: Map<UUID, GameSession> = new Map();

// TODO: Chat
export type GameConnection = WebSocket & {
	lastKeepAlive: number,
	pollTimeout?: NodeJS.Timeout,
	id: UUID,
	player?: SessionPlayer
}

export type SessionPlayer = /*Identity &?*/ {
	conn: GameConnection[],
	game?: GameSession,
	id: UUID,
}

export type PlayerMove = {
	player: Player,
	pos: Position
}

export type GameSession = {
	id: UUID,
	state: GameState,
	blackPlayer: SessionPlayer,
	whitePlayer: SessionPlayer,
	spectators: SessionPlayer[],
	allowSpectators: boolean,
	timeLimit: number, // In seconds, -1 for unlimited
	moves: PlayerMove[]
}

/**
* Create a game session and store it in SESSIONS
* timeLimit set to -1 for unlimited time.
*/
export function createGameSession(
	white: GameConnection,
	black: GameConnection,
	allowSpectators: boolean,
	timeLimit: number
): GameSession {
	const blackPlayer: SessionPlayer = { conn: [ black ], id: black.id };
	const whitePlayer: SessionPlayer = { conn: [ white ], id: white.id };
	black.player = blackPlayer;
	white.player = whitePlayer;
	const game: GameSession = {
		id: randomUUID(),
		state: createInitialGameState(),
		blackPlayer: blackPlayer,
		whitePlayer: whitePlayer,
		spectators: [],
		allowSpectators, timeLimit,
		moves: []
	};

	blackPlayer.game = game;
	whitePlayer.game = game;

	SESSIONS.set(game.id, game);

	return game;
}

export function isConnectionAlive(conn: GameConnection): boolean {
	return Date.now() - conn.lastKeepAlive < 20000; // Connection is considered dead after 20 seconds
}

export function isPlayerAlive(p: SessionPlayer): boolean {
	return p.conn.some(isConnectionAlive);
}

export function onConnectionCut(conn: GameConnection) {
	// TODO
}

export function resetTimeout(conn: GameConnection) {
	clearTimeout(conn.pollTimeout);
	conn.pollTimeout = setTimeout(() => onConnectionCut(conn));
}
