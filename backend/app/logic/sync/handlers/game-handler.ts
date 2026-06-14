import { RawData } from "ws";
import { Position } from "../../game";
import { Socket } from "../socket";
import { GameSession, SessionPlayer } from "../session";
import { ByteReader } from "../stream-utils/reader";

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

function onConsumeTurn(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.player) return;

	const pos: Position = { row: reader.readUint8(), col: reader.readUint8() };
	game.consumeTurn(conn, pos);
}

function onReady(_: ByteReader, game: GameSession, conn: SessionPlayer) {
	game.playerReady(conn);
}

function onChat(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	const message = reader.readPrefixedUTF();
	game.chat(conn, message);
}
function onPlayerAbandon(_: ByteReader, game: GameSession, player: SessionPlayer, sock: Socket) {
    sock.abandonedExplicitly = true
    game.playerAbandon(sock);
}


const callbacks: Array<(read: ByteReader, game: GameSession, player: SessionPlayer, sock: Socket) => void> = [];

callbacks[Protocol.ConsumeTurn] = onConsumeTurn;
callbacks[Protocol.Ready] = onReady;
callbacks[Protocol.ChatMessage] = onChat;
callbacks[Protocol.PlayerAbandon] = onPlayerAbandon;

export default function handler(data: RawData, conn: Socket) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (typeId === Protocol.KeepAlive)
		conn.onKeepAlive();
	else if (conn.player && conn.player.game && callbacks[typeId])
		callbacks[typeId](reader, conn.player.game, conn.player, conn);
}
