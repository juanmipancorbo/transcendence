import { UUID } from "crypto";
import { PreGameProtocol, Protocol } from "./protocol";
import { ByteWriter } from "./stream-utils/writer";
import { Board, Player, Position } from "../game";
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

export function buildMatchFound(gameId: UUID, color: number, opponent: UUID): BufferSource {
	return build(PreGameProtocol.MatchFound)
		.writePrefixedUTF(gameId)
		.writeUint8(color)
		.writePrefixedUTF(opponent)
		.freeze();
}

// In-Game

export function buildOpponentAbandon() {
	return build(Protocol.OpponentAbandon).freeze();
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

export function buildMoveUpdate(player: Player, move: Position, updates: PositionUpdate[]): BufferSource {
	const writer = build(Protocol.MoveUpdate)
		.writeUint8(player)
		.writeUint8(move.row)
		.writeUint8(move.col)
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
		.writeUint32(timeToLose)
		.writeUint32(moves.length);
	moves.forEach(m => {
		writer.writeUint8(m.row);
		writer.writeUint8(m.col);
	});

	return writer.freeze();
}

export function buildOpponentTurn(): BufferSource {
	return build(Protocol.OpponentTurn).freeze();
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
