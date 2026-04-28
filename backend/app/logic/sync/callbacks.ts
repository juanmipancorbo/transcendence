import { GameConnection, resetTimeout } from "./session";
import { ByteReader } from "./stream-utils/reader";

export function onKeepAlive(_: ByteReader, conn: GameConnection) {
	conn.lastKeepAlive = Date.now();
	resetTimeout(conn);
}
