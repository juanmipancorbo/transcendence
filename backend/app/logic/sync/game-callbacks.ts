import { STATUS_ACTIVE } from "../game";
import { nextTurn, Protocol } from "./protocol";
import { build } from "./protocol-utils";
import { broadcastToGame, GameSession, SessionPlayer } from "./session";
import { ByteReader } from "./stream-utils/reader";

export function onPlayerMove(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	
}

export function onReady(_: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.ready) {
		conn.ready = true;
		if (game.blackPlayer.ready && game.whitePlayer.ready) {
			game.state.status = STATUS_ACTIVE;
			broadcastToGame(game, build(Protocol.GameStart).freeze());
			nextTurn(game);
		}
	}
}

export function a(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
export function b(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
export function c(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
export function d(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
export function e(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
export function f(reader: ByteReader, game: GameSession, conn: SessionPlayer) {}
