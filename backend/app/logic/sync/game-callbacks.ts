import { applyPlayerMove, BLACK, Position, STATUS_ACTIVE } from "../game";
import { nextTurn, Protocol } from "./protocol";
import { build, buildChatMessage, buildGameError, buildMoveUpdate } from "./protocol-utils";
import { broadcastToGame, GameSession, PositionUpdate, send, SessionPlayer } from "./session";
import { ByteReader } from "./stream-utils/reader";

export function onConsumeTurn(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.player) return;

	if (game.state.currentTurn !== conn.player) {
		send(conn, buildGameError("It's not your turn"));
		return;
	}

	const pos: Position = { row: reader.readUint8(), col: reader.readUint8() };
	const previousBoard = game.state.board;
	if (game.timeLimit !== -1 && conn.timeout && conn.timer) {
		clearTimeout(conn.timeout);
		conn.timeLeft -= Date.now() - conn.timer;
	}
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
	broadcastToGame(game, buildMoveUpdate(updates));

	const opponent = conn.player === BLACK ? game.whitePlayer : game.blackPlayer;
	send(conn, build(Protocol.OpponentNoMoves).freeze());
	send(opponent, build(Protocol.NoMoves).freeze());

	nextTurn(game);
}

export function onReady(_: ByteReader, game: GameSession, conn: SessionPlayer) {
	if (!conn.ready) {
		conn.ready = true;
		if (game.blackPlayer.ready && game.whitePlayer.ready) {
			game.state.status = STATUS_ACTIVE;
			broadcastToGame(game, build(Protocol.GameStart).freeze());
			game.startedAt = Date.now();
			nextTurn(game);
		}
	}
}

export function onChat(reader: ByteReader, game: GameSession, conn: SessionPlayer) {
	const message = reader.readPrefixedUTF();
	const output = buildChatMessage(conn.id, message);
	game.spectators.forEach(s => send(s, output));

	if (!game.spectators.has(conn)) {
		send(game.whitePlayer, output);
		send(game.blackPlayer, output);
	}
}
