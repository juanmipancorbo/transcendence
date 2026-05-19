import { Position } from "../game";
import { GameSession, SessionPlayer } from "./session";
import { ByteReader } from "./stream-utils/reader";

export function onConsumeTurn(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.player) return;

	const pos: Position = { row: reader.readUint8(), col: reader.readUint8() };
	game.consumeTurn(conn, pos);
}

export function onReady(_: ByteReader, game: GameSession, conn: SessionPlayer) {
	game.playerReady(conn);
}

export function onChat(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	const message = reader.readPrefixedUTF();
	game.chat(conn, message);
}
