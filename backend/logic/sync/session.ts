import { randomUUID, UUID } from "crypto";
import { createInitialGameState, GameState, Player, Position } from "../game";

export type GameConnection = WebSocket & {
	lastKeepAlive: number,
	pollTimeout: number,
	player: SessionPlayer
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

export interface GameSession {
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
* Create a game session
* timeLimit set to -1 for unlimited time.
*/
export function createGameSession(
	white: SessionPlayer,
	black: SessionPlayer,
	allowSpectators: boolean,
	timeLimit: number
): GameSession {
	return {
		id: randomUUID(),
		state: createInitialGameState(),
		blackPlayer: black,
		whitePlayer: white,
		spectators: [],
		allowSpectators, timeLimit,
		moves: []
	};
}

export function isConnectionAlive(conn: GameConnection): boolean {
	return Date.now() - conn.lastKeepAlive < 20000; // Connection is considered dead after 20 seconds
}

export function isPlayerAlive(p: SessionPlayer): boolean {
	return p.conn.some(isConnectionAlive);
}


