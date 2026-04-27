import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { createGameSession, GameConnection, GameSession, resetTimeout, SessionPlayer } from "./session";
import { UUID } from "crypto";
import { buildMatchFound, buildMatchmakeError } from "./protocol-utils";
import { BLACK, WHITE } from "../game";

function isUUID(s: string): s is UUID {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export enum PreGameProtocol {
	Quickplay,
	KeepAlive,
	Error,
	MatchFound,
	MatchmakeError,
}

const pregameCallbacks = [
	onQuickplay,
	onKeepAlive
]

let quickplay: GameConnection | null = null

function onQuickplay(_: ByteReader, conn: GameConnection) {
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

function onKeepAlive(_: ByteReader, conn: GameConnection) {
	conn.lastKeepAlive = Date.now();
	resetTimeout(conn);
}

export enum Protocol {
	PlayerMoved,
	PlayerMoveRejected,
	PlayerAbandoned,
	PlayerDisconnected,
	onSpectatorJoin,
	StatusChanged,
	Error
}

const gameCallbacks = [
	onPlayerMove,
	onPlayerAbandon,
	onPlayerDisconnect
];

export function onMessageReceive(data: RawData, conn: GameConnection) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (conn.player && conn.player.game && typeId < Protocol.Error)
		gameCallbacks[typeId](reader, conn.player.game, conn.player);
	else if (typeId < PreGameProtocol.Error)
		pregameCallbacks[typeId](reader, conn);
}

function onPlayerMove(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}

function onPlayerAbandon(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}

function onPlayerDisconnect(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}
