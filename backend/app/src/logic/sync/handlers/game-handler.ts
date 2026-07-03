import { RawData } from "ws";
import { Position } from "../../game";
import { CloseCodes, Socket } from "../socket";
import { GameSession, SessionPlayer } from "../session";
import { ByteReader } from "../stream-utils/reader";

export enum Protocol {
	KeepAlive = 0,
	ConsumeTurn = 1,
	Ready = 2,
	ChatMessage = 3,
	SpectatorJoin = 4,
	SpectatorLeave = 5,
	BlackTurn = 6,
	WhiteTurn = 7,
	BlackNoMoves = 8,
	WhiteNoMoves = 9,
	BlackAbandon = 10,
	WhiteAbandon = 11,
	BlackDisconnect = 12,
	WhiteDisconnect = 13,
	BlackReconnect = 14,
	WhiteReconnect = 15,
	Abandon = 16,
	Disconnect = 17,
	Board = 18,
	State = 19,
	MoveUpdate = 20,
	GameStart = 21,
	GameEnd = 22,
	XpUpdate = 23,
	Error = 24,
	FatalError = 25
};

function onConsumeTurn(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.player) return;

	const pos: Position = { row: reader.readUint8(), col: reader.readUint8() };
	game.consumeTurn(conn, pos);
}

function onReady(_: ByteReader, game: GameSession, _player: SessionPlayer, conn: Socket) {
	game.playerReady(conn);
}

function onChat(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	const message = reader.readPrefixedUTF();
	game.chat(conn, message);
}

function onPlayerAbandon(_: ByteReader, game: GameSession, _player: SessionPlayer, sock: Socket) {
    game.playerAbandon(sock);
}

function onPlayerDisconnect(_: ByteReader, game: GameSession, _player: SessionPlayer, conn: Socket) {
	game.playerDisconnect(conn);
}

const callbacks: Array<(read: ByteReader, game: GameSession, player: SessionPlayer, sock: Socket) => void> = [];

callbacks[Protocol.ConsumeTurn] = onConsumeTurn;
callbacks[Protocol.Ready] = onReady;
callbacks[Protocol.ChatMessage] = onChat;
callbacks[Protocol.Abandon] = onPlayerAbandon;
callbacks[Protocol.Disconnect] = onPlayerDisconnect;

export default function handler(data: RawData, conn: Socket) {
	const reader = new ByteReader(data);
	try {
		const typeId = reader.readUint8();
		if (typeId === Protocol.KeepAlive)
			conn.onKeepAlive();
		else if (conn.player && conn.player.game && callbacks[typeId])
			callbacks[typeId](reader, conn.player.game, conn.player, conn);
	} catch (_) {
		conn.close(CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
	}
}
