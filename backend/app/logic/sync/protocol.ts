import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { broadcastToGame, GameConnection, GameSession, send } from "./session";
import { UUID } from "crypto";
import { build, buildOpponentAbandon, buildOpponentTurn, buildSpectatorLeave, buildYourTurn } from "./protocol-utils";
import { abandonGame, BLACK, getValidMoves, STATUS_ABANDONED, STATUS_FINISHED, WHITE } from "../game";
import { onPlayerMove, onReady } from "./game-callbacks";
import { onKeepAlive } from "./callbacks";
import { quickplay, unsetQuickplay } from "../../websockets";

function isUUID(s: string): s is UUID {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export enum PreGameProtocol {
	KeepAlive = 0,
	Error = 1,
	MatchFound = 2,
	MatchmakeError = 3
}

const pregameCallbacks = [
	onKeepAlive
]

export enum Protocol {
	ConsumeTurn = 0,
	//PlayerDisconnected = 2,
	Ready = 3,
	ChatMessage = 4,
	SpectatorJoin = 5,
	SpectatorLeave = 6,
	YourTurn = 7,
	OpponentTurn = 8,
	YouWin = 9,
	YouLose = 10,
	NoMoves = 11,
	PlayerAbandon = 12,
	OpponentAbandon = 13,
	Board = 14,
	MoveUpdate = 15,
	GameStart = 16,
	Error = 17
}

const gameCallbacks = [
	onPlayerMove,
	null,
	null,
	onReady
];

export function onMessageReceive(data: RawData, conn: GameConnection) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (conn.player && conn.player.game && gameCallbacks[typeId])
		gameCallbacks[typeId](reader, conn.player.game, conn.player);
	else if (pregameCallbacks[typeId])
		pregameCallbacks[typeId](reader, conn);
}

function abandon(conn: GameConnection, game: GameSession) {
	if (game.state.status !== "FINISHED") {
		abandonGame(game.state, conn.id);
		if (game.blackPlayer.id === conn.id)
			send(game.whitePlayer, buildOpponentAbandon())
		else if (game.whitePlayer.id === conn.id)
			send(game.blackPlayer, buildOpponentAbandon())
	}
}

export function onPlayerAbandon(conn: GameConnection, game: GameSession) {
	// Remove spectator
	for (const spec of game.spectators) {
		if (spec.id === conn.id && spec.conn.has(conn)) {
			broadcastToGame(game, buildSpectatorLeave(spec.id));
			game.spectators.delete(spec);
			return;
		}
	}

	abandon(conn, game);
	if (quickplay && quickplay.id === conn.id)
		unsetQuickplay();
}

export function onPlayerDisconnect(conn: GameConnection, game: GameSession) {
	// Remove spectator
	for (const spec of game.spectators) {
		if (spec.id === conn.id && spec.conn.has(conn)) {
			if (spec.conn.size === 1) {
				broadcastToGame(game, buildSpectatorLeave(spec.id));
				game.spectators.delete(spec);
			}
			spec.conn.delete(conn);
			return;
		}
	}

	let player = game.blackPlayer.id === conn.id ? game.blackPlayer : game.whitePlayer.id === conn.id ? game.whitePlayer : null;
	if (player && player.conn.delete(conn) && player.conn.size === 0)
		abandon(conn, game);
	if (quickplay && quickplay.id === conn.id)
		unsetQuickplay();
}

export function nextTurn(game: GameSession) {
	if (game.state.status === STATUS_FINISHED || game.state.status === STATUS_ABANDONED) {
		send(game.state.winner === BLACK ? game.blackPlayer : game.whitePlayer, build(Protocol.YouWin).freeze());
		send(game.state.winner === BLACK ? game.whitePlayer : game.blackPlayer, build(Protocol.YouLose).freeze());
	} else if (game.state.currentTurn === BLACK) {
		send(game.blackPlayer, buildYourTurn(getValidMoves(game.state.board, BLACK)));
		send(game.whitePlayer, buildOpponentTurn());
	} else if (game.state.currentTurn === WHITE) {
		send(game.whitePlayer, buildYourTurn(getValidMoves(game.state.board, WHITE)));
		send(game.blackPlayer, buildOpponentTurn());
	}
}
