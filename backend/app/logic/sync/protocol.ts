import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { broadcastToGame, closeSession, GameConnection, GameSession, send } from "./session";
import { UUID } from "crypto";
import { buildGameEnd, buildOpponentAbandon, buildOpponentTurn, buildSpectatorLeave, buildYourTurn } from "./protocol-utils";
import { abandonGame, BLACK, getValidMoves, STATUS_ABANDONED, STATUS_FINISHED, WHITE } from "../game";
import { onChat, onConsumeTurn, onReady } from "./game-callbacks";
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
	Ready = 3,
	ChatMessage = 4,
	SpectatorJoin = 5,
	SpectatorLeave = 6,
	YourTurn = 7,
	OpponentTurn = 8,
	NoMoves = 9,
	OpponentNoMoves = 10,
	PlayerAbandon = 11,
	OpponentAbandon = 12,
	Board = 13,
	MoveUpdate = 14,
	GameStart = 15,
	GameEnd = 16,
	Error = 17
}

const gameCallbacks = [
	onConsumeTurn,
	null,
	null,
	onReady,
	onChat
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

// Determines the winner, if no winner is set it stops the game with a draw
export function reportFinishedGame(game: GameSession) {
	broadcastToGame(game, buildGameEnd(game));
	// TODO: If leaderboard or exp systems, add something here
	closeSession(game);
}

export function nextTurn(game: GameSession) {
	if (game.state.status === STATUS_FINISHED || game.state.status === STATUS_ABANDONED)
		reportFinishedGame(game);
	else if (game.state.currentTurn === BLACK) {
		let timeToLose;
		send(game.whitePlayer, buildOpponentTurn());

		if (game.timeLimit !== -1) {
			timeToLose = game.blackPlayer.timeLeft;
			game.blackPlayer.timer = Date.now();
			game.blackPlayer.timeout = setTimeout(() => {
				game.state.winner = WHITE;
				game.state.status = STATUS_FINISHED;

				reportFinishedGame(game);
			}, game.blackPlayer.timeLeft);
		} else timeToLose = -1;

		send(game.blackPlayer, buildYourTurn(getValidMoves(game.state.board, BLACK), timeToLose));
	} else if (game.state.currentTurn === WHITE) {
		let timeToLose;
		send(game.blackPlayer, buildOpponentTurn());

		if (game.timeLimit !== -1) {
			timeToLose = game.whitePlayer.timeLeft;
			game.whitePlayer.timer = Date.now();
			game.whitePlayer.timeout = setTimeout(() => {
				game.state.winner = BLACK;
				game.state.status = STATUS_FINISHED;

				reportFinishedGame(game);
			}, game.whitePlayer.timeLeft);
		} else timeToLose = -1;

		send(game.whitePlayer, buildYourTurn(getValidMoves(game.state.board, WHITE), timeToLose));
	}
}
