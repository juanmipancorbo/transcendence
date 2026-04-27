import { BLACK, WHITE } from "../game";
import { buildMatchFound, buildMatchmakeError } from "./protocol-utils";
import { createGameSession, GameConnection, resetTimeout } from "./session";
import { ByteReader } from "./stream-utils/reader";

export let quickplay: GameConnection | null = null;

export function unsetQuickplay() {
	quickplay = null;
}

export function onQuickplay(_: ByteReader, conn: GameConnection) {
	if (!quickplay)
		quickplay = conn;
	else if (quickplay.id === conn.id)
		conn.send(buildMatchmakeError("You are already on queue"));
	else {
		const game = createGameSession(quickplay, conn, false /* TODO: Maybe take into account user settings */, 100);
		quickplay.send(buildMatchFound(game.id, WHITE, conn.id));
		conn.send(buildMatchFound(game.id, BLACK, quickplay.id));
		quickplay = null;
	}
}

export function onKeepAlive(_: ByteReader, conn: GameConnection) {
	conn.lastKeepAlive = Date.now();
	resetTimeout(conn);
}
