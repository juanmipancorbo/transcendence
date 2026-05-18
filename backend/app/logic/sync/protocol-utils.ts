import { UUID } from "crypto";
import { PreGameProtocol, Protocol } from "./protocol";
import { ByteWriter } from "./stream-utils/writer";
import { Board, getValidMoves, Player, Position, STATUS_ACTIVE } from "../game";
import { GameSession, PositionUpdate } from "./session";

export function build(typeId: number): ByteWriter {
	return new ByteWriter().writeUint8(typeId);
}

// PreGame

export function buildMatchmakeError(message: string): BufferSource {
	return build(PreGameProtocol.MatchmakeError)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildPreGameError(message: string): BufferSource {
	return build(PreGameProtocol.Error)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildMatchFound(game: GameSession, color: number, opponent: UUID): BufferSource {
	return build(PreGameProtocol.MatchFound)
		.writePrefixedUTF(game.id)
		.freeze();
}

// In-Game

/**
* @param as: BLACK | WHITE, anything else means its as spectator
*/
export function buildGameState(game: GameSession, as: number): BufferSource {
	const w = build(Protocol.State)
		.writePrefixedUTF(game.id)
		.writeBoard(game.state.board)
		.writeUint8(as)
		.writePrefixedUTF(game.whitePlayer.id)
		.writePrefixedUTF(game.blackPlayer.id)
		.writeInt32(game.timeLimit)
		.writePrefixedUTF(game.state.status)
		.writeBool(game.allowSpectators);
	if (game.state.status === STATUS_ACTIVE) {
		w.writeUint8(game.state.currentTurn);
		w.writeUint32(game.startedAt as number);
		if (game.state.currentTurn === as) {
			const validMoves = getValidMoves(game.state.board, as);
			w.writeUint8(validMoves.length);
			for (const move of validMoves) {
				w.writeUint8(move.row);
				w.writeUint8(move.col);
			}
		}

	}
	return w.freeze();
}

export function buildOpponentAbandon() {
	return build(Protocol.OpponentAbandon).freeze();
}

export function buildSpectatorJoin(specId: UUID): BufferSource {
	return build(Protocol.SpectatorJoin)
		.writePrefixedUTF(specId)
		.freeze();
}

export function buildSpectatorLeave(specId: UUID): BufferSource {
	return build(Protocol.SpectatorLeave)
		.writePrefixedUTF(specId)
		.freeze();
}

export function buildGameError(message: string): BufferSource {
	return build(Protocol.Error)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildBoard(board: Board) {
	return build(Protocol.Board)
		.writeBoard(board)
		.freeze();
}

export function buildMoveUpdate(/*player: Player, move: Position, */updates: PositionUpdate[]): BufferSource {
	const writer = build(Protocol.MoveUpdate)
		.writeUint32(updates.length);
	updates.forEach(p => {
		writer.writeUint8(p.content);
		writer.writeUint8(p.pos.row);
		writer.writeUint8(p.pos.col);
	});

	return writer.freeze();
}

export function buildYourTurn(moves: Position[], timeToLose: number): BufferSource {
	const writer = build(Protocol.YourTurn)
		.writeInt32(timeToLose)
		.writeUint32(moves.length);
	moves.forEach(m => {
		writer.writeUint8(m.row);
		writer.writeUint8(m.col);
	});

	return writer.freeze();
}

export function buildOpponentTurn(opponentTimeToLose: number): BufferSource {
	return build(Protocol.OpponentTurn)
		.writeInt32(opponentTimeToLose)
		.freeze()
}

export function buildGameEnd(game: GameSession): BufferSource {
	return build(Protocol.GameEnd)
		.writeUint8(!game.state.winner || game.state.winner === "DRAW" ? 0 : game.state.winner)
		.freeze();
}

export function buildChatMessage(senderId: UUID, message: string): BufferSource {
	return build(Protocol.ChatMessage)
		.writePrefixedUTF(senderId)
		.writePrefixedUTF(message)
		.freeze();
}
