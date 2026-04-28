import { randomUUID, UUID } from "crypto";
import { createInitialGameState, GameState, Player, Position } from "../game";
import { WebSocket } from "ws";
import { onPlayerDisconnect } from "./protocol";

export const SESSIONS: Map<UUID, GameSession> = new Map();

// TODO: Chat
export type GameConnection = WebSocket & {
	lastKeepAlive: number,
	pollTimeout?: NodeJS.Timeout,
	id: UUID,
	player?: SessionPlayer
}

export type SessionPlayer = /*Identity &?*/ {
	conn: Set<GameConnection>,
	game?: GameSession,
	ready: boolean,
	id: UUID,
}

export type PlayerMove = {
	player: Player,
	pos: Position
}

export type Message = {
	source: UUID,
	content: string
}

export type GameSession = {
	id: UUID,
	state: GameState,
	blackPlayer: SessionPlayer,
	whitePlayer: SessionPlayer,
	spectators: Set<SessionPlayer>,
	allowSpectators: boolean,
	timeLimit: number, // In seconds, -1 for unlimited
	moves: PlayerMove[],
	messages: Message[]
}

export function broadcastToGame(game: GameSession, buf: BufferSource) {
	game.blackPlayer.conn.forEach(b => b.send(buf));
	game.whitePlayer.conn.forEach(w => w.send(buf));
	game.spectators.forEach(spec => spec.conn.forEach(conn => conn.send(buf)));
}

export function send(player: SessionPlayer, buf: BufferSource) {
	player.conn.forEach(c => c.send(buf));
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
	const blackPlayer: SessionPlayer = { conn: new Set([ black ]), id: black.id, ready: false };
	const whitePlayer: SessionPlayer = { conn: new Set([ white ]), id: white.id, ready: false };
	black.player = blackPlayer;
	white.player = whitePlayer;
	const game: GameSession = {
		id: randomUUID(),
		state: createInitialGameState(),
		blackPlayer: blackPlayer,
		whitePlayer: whitePlayer,
		spectators: new Set(),
		allowSpectators, timeLimit,
		moves: [],
		messages: []
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
	for (const v of p.conn.values()) {
		if (!isConnectionAlive(v))
			return false;
	}
	return true;
}

export function resetTimeout(conn: GameConnection) {
	clearTimeout(conn.pollTimeout);
	conn.pollTimeout = setTimeout(() => {
		if (conn.player && conn.player.game)
			onPlayerDisconnect(conn, conn.player.game);
		conn.close();
	}, 20000);
}
