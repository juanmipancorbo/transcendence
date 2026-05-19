import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { GameConnection, type SessionPlayer } from "./session";
import { onChat, onConsumeTurn, onReady } from "./game-callbacks";
import { onKeepAlive } from "./callbacks";

export enum PreGameProtocol {
	Error = 0,
	MatchFound = 1,
	MatchmakeError = 2
}

export enum Protocol {
	KeepAlive = 0,
	ConsumeTurn = 1,
	Ready = 2,
	ChatMessage = 3,
	SpectatorJoin = 4,
	SpectatorLeave = 5,
	YourTurn = 6,
	OpponentTurn = 7,
	NoMoves = 8,
	OpponentNoMoves = 9,
	PlayerAbandon = 10,
	OpponentAbandon = 11,
	Board = 12,
	State = 13,
	MoveUpdate = 14,
	GameStart = 15,
	GameEnd = 16,
	Error = 17
};

const gameCallbacks = [
	onConsumeTurn,
	null,
	null,
	onReady,
	onChat
];

export function send(player: SessionPlayer, buf: BufferSource) {
	player.conn.forEach(c => c.send(buf));
}

export function onMessageReceive(data: RawData, conn: GameConnection) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (typeId === Protocol.KeepAlive)
		onKeepAlive(conn);
	else if (conn.player && conn.player.game && gameCallbacks[typeId])
		gameCallbacks[typeId](reader, conn.player.game, conn.player);
}
