import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { GameConnection, GameSession, SessionPlayer } from "./session";

export enum PreGameProtocol {
	JoinMatch
}

export enum Protocol {
	StatusChanged,
	PlayerMoved,
	PlayerMoveAccepted,
	PlayerMoveRejected,
	PlayerAbandoned,
	PlayerDisconnected,
	onSpectatorJoin
}

const callbacks = [
	onPlayerMove,
	onPlayerAbandon,
	onPlayerDisconnect
];

function onMessageReceive(data: RawData, game: GameSession, conn: GameConnection) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	callbacks[typeId](reader, game, conn.player);
}

function onPlayerMove(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}

function onPlayerAbandon(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}

function onPlayerDisconnect(reader: ByteReader, game: GameSession, conn: SessionPlayer) {

}
