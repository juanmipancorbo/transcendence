import { UUID } from "crypto";
import { GameState } from "../game";

export type GameConnection = WebSocket & {
	lastKeepAlive: number,
	pollTimeout: number,
	player: SessionPlayer
}

export type SessionPlayer = /*Identity &?*/ {
	conn: GameConnection[],
	game: GameSession,
	id: UUID,
}

export interface GameSession {
	state: GameState,
	blackPlayer?: SessionPlayer,
	whitePlayer?: SessionPlayer,
}

export function isConnectionAlive(conn: GameConnection): boolean {
	return Date.now() - conn.lastKeepAlive < 20000; // Connection is considered dead after 20 seconds
}

export function isPlayerAlive(p: SessionPlayer): boolean {
	return p.conn.some(isConnectionAlive);
}


