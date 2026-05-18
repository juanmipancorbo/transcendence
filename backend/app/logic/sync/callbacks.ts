import { GameConnection, resetTimeout } from "./session";

export function onKeepAlive(conn: GameConnection) {
	conn.lastKeepAlive = Date.now();
	resetTimeout(conn);
}
