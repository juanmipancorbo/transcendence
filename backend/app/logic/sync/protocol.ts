import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { broadcastToGame, closeSession, GameConnection, GameSession, send } from "./session";
import { buildGameEnd, buildOpponentAbandon, buildOpponentTurn, buildSpectatorLeave, buildYourTurn } from "./protocol-utils";
import { abandonGame, BLACK, getValidMoves, STATUS_ABANDONED, STATUS_FINISHED, WHITE } from "../game";
import { onChat, onConsumeTurn, onReady } from "./game-callbacks";
import { quickplay, unsetQuickplay } from "../../websockets";
import { onKeepAlive } from "./callbacks";

export enum PreGameProtocol {
	Error = 0,
	MatchFound = 1,
	MatchmakeError = 2
}

export enum Protocol {
	ConsumeTurn = 0,
	Ready = 1,
	ChatMessage = 2,
	SpectatorJoin = 3,
	SpectatorLeave = 4,
	YourTurn = 5,
	OpponentTurn = 6,
	NoMoves = 7,
	OpponentNoMoves = 8,
	PlayerAbandon = 9,
	OpponentAbandon = 10,
	Board = 11,
	MoveUpdate = 12,
	GameStart = 13,
	GameEnd = 14,
	Error = 15
};

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

	if (typeId === 0)
		onKeepAlive(conn);
	else if (conn.player && conn.player.game && gameCallbacks[typeId])
		gameCallbacks[typeId](reader, conn.player.game, conn.player);
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
	game.finishedAt = Date.now();
	broadcastToGame(game, buildGameEnd(game));
	// TODO: Save and if leaderboard or exp systems, add something here
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
