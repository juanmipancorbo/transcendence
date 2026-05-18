import { randomUUID, UUID } from "crypto";
import { BLACK, Cell, createInitialGameState, GameState, Player, Position, STATUS_WAITING, WHITE } from "../game";
import { WebSocket } from "ws";
import { onPlayerDisconnect } from "./protocol";
import { buildGameState, buildSpectatorJoin } from "./protocol-utils";

export const SESSIONS: Map<UUID, GameSession> = new Map();

export type GameConnection = WebSocket & {
	lastKeepAlive: number,
	pollTimeout?: NodeJS.Timeout,
	id: UUID,
	player?: SessionPlayer
}

export type SessionPlayer = /*Identity &?*/ {
	conn: Set<GameConnection>,
	game?: GameSession,
	player?: Player,
	ready: boolean,
	timeLeft: number,
	timer?: number | null,
	timeout?: NodeJS.Timeout | null,
	id: UUID,
}

export type PositionUpdate = {
	content: Cell,
	pos: Position
}

export type PlayerMove = {
	player: Player,
	pos: Position,
	updates: PositionUpdate[]
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
	messages: Message[],
	startedAt?: number,
	finishedAt?: number
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
	white: UUID,
	black: UUID,
	allowSpectators: boolean,
	timeLimit: number
): GameSession {
	const blackPlayer: SessionPlayer = { conn: new Set(), id: black, ready: false, timeLeft: timeLimit * 1000 };
	const whitePlayer: SessionPlayer = { conn: new Set(), id: white, ready: false, timeLeft: timeLimit * 1000 };
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
	blackPlayer.player = BLACK;
	whitePlayer.player = WHITE;
	game.state.status = STATUS_WAITING;

	SESSIONS.set(game.id, game);
	// TODO: updateUserGame

	return game;
}

function joinGameAsSpec(conn: GameConnection, session: GameSession) {
	for (const s of session.spectators) {
		if (s.id === conn.id) {
			s.conn.add(conn);
			conn.player = s;
			return;
		}
	}
	broadcastToGame(session, buildSpectatorJoin(conn.id));
	const player: SessionPlayer = { timeLeft: -1, conn: new Set([ conn ]), id: conn.id, ready: false };
	conn.player = player;
	session.spectators.add(player);
}

export function joinGame(conn: GameConnection, session: GameSession): void | Error {
	if (session.whitePlayer.id === conn.id) {
		session.whitePlayer.conn.add(conn);
		conn.player = session.whitePlayer;
	} else if (session.blackPlayer.id === conn.id) {
		session.blackPlayer.conn.add(conn);
		conn.player = session.blackPlayer;
	} else if (session.allowSpectators) {
		joinGameAsSpec(conn, session);
	} else return new Error("This game doesn't allow spectators");
	conn.send(buildGameState(session, (conn.player as SessionPlayer).player as Player))
}

export function closeSession(game: GameSession) {
	SESSIONS.delete(game.id);
	game.blackPlayer.conn.forEach(c => c.close());
	game.whitePlayer.conn.forEach(c => c.close());
	game.spectators.forEach(s => s.conn.forEach(c => c.close()));
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
