import { applyPlayerMove, BLACK, getValidMoves, Position, STATUS_ACTIVE, STATUS_FINISHED } from "../game";
import { nextTurn, Protocol } from "./protocol";
import { build, buildGameEnd, buildGameError, buildMoveUpdate, buildOpponentTurn, buildYourTurn } from "./protocol-utils";
import { broadcastToGame, closeSession, GameSession, PositionUpdate, send, SessionPlayer } from "./session";
import { ByteReader } from "./stream-utils/reader";

export function onConsumeTurn(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.player) return;

	if (game.state.currentTurn !== conn.player) {
		send(conn, buildGameError("It's not your turn"));
		return;
	}

	const pos: Position = { row: reader.readUint8(), col: reader.readUint8() };
	const previousBoard = game.state.board;
	game.state = applyPlayerMove(game.state, conn.id, pos.row, pos.col);

	const updates: PositionUpdate[] = [];

	for (let i = 0; i < previousBoard.length; ++i) {
		for (let j = 0; j < previousBoard[i].length; ++j) {
			if (game.state.board[i][j] !== previousBoard[i][j])
				updates.push({ content: game.state.board[i][j], pos: { row: i, col: j } });
		}
	}
	game.moves.push({ player: conn.player, pos, updates });

	// Send state updates to whole game
	broadcastToGame(game, buildMoveUpdate(conn.player, pos, updates));

	if (game.state.status === STATUS_FINISHED) {
		broadcastToGame(game, buildGameEnd(game));
		// TODO: If leaderboard or exp systems, add something here
		closeSession(game);
		return;
	}

	const opponent = conn.player === BLACK ? game.whitePlayer : game.blackPlayer;
	if (game.state.currentTurn === conn.player) {
		send(conn, buildYourTurn(getValidMoves(game.state.board, conn.player)));
		send(conn, build(Protocol.OpponentNoMoves).freeze());
		send(opponent, build(Protocol.NoMoves).freeze());
	} else if (opponent.player) {
		send(opponent, buildYourTurn(getValidMoves(game.state.board, opponent.player)));
		send(conn, buildOpponentTurn());
	}
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
