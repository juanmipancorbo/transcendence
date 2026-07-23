import { UUID } from "crypto";
import { ByteWriter } from "./stream-utils/writer";
import { Board, getValidMoves, Position, STATUS_ACTIVE } from "../game";
import { GameSession, PositionUpdate } from "./session";

import { Protocol as GameProtocol }  from "./handlers/game-handler";
import { Protocol as GlobalProtocol, ProtocolCodes } from "./handlers/global-handler";
import { DuelSettings } from "./duel-utils";

export function build(typeId: number): ByteWriter {
	return new ByteWriter().writeUint8(typeId);
}

// Global

export function buildError(message: string, code?: number): BufferSource {
	return build(GlobalProtocol.Error)
		.writePrefixedUTF(message)
		.writeUint8(code ?? ProtocolCodes.Generic)
		.freeze();
}

export function buildInfoMessage(message: string): BufferSource {
	return build(GlobalProtocol.Info)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildMatchFound(game: GameSession, opponent: UUID): BufferSource {
	return build(GlobalProtocol.MatchFound)
		.writePrefixedUTF(game.id)
		.writePrefixedUTF(opponent)
		.freeze();
}

export function buildFriendRequest(from: UUID): BufferSource {
	return build(GlobalProtocol.FriendReqSend)
		.writePrefixedUTF(from)
		.freeze();
}

export function buildFriendChatMessage(sender: UUID, message: string): BufferSource {
	return build(GlobalProtocol.Chat)
		.writePrefixedUTF(sender)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildDuelRequest(sender: UUID, settings: DuelSettings) {
	return build(GlobalProtocol.DuelRequest)
		.writePrefixedUTF(sender)
		.writeBool(settings.allowSpectators)
		.writeInt32(settings.timeLimit)
		.freeze();
}

// In-Game

/**
* @param as: BLACK | WHITE, anything else means its as spectator
*/
export function buildGameState(game: GameSession, as: number): BufferSource {
	const w = build(GameProtocol.State)
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

export function buildBlackAbandon() {
	return build(GameProtocol.BlackAbandon).freeze();
}

export function buildWhiteAbandon() {
	return build(GameProtocol.WhiteAbandon).freeze();
}

export function buildBlackDisconnect(reconnectTimeMs: number) {
	return build(GameProtocol.BlackDisconnect)
		.writeUint32(reconnectTimeMs)
		.freeze();
}

export function buildWhiteDisconnect(reconnectTimeMs: number) {
	return build(GameProtocol.WhiteDisconnect)
		.writeUint32(reconnectTimeMs)
		.freeze();
}

export function buildBlackReconnected() {
	return build(GameProtocol.BlackReconnect).freeze();
}

export function buildWhiteReconnected() {
	return build(GameProtocol.WhiteReconnect).freeze();
}

export function buildSpectatorJoin(specId: UUID): BufferSource {
	return build(GameProtocol.SpectatorJoin)
		.writePrefixedUTF(specId)
		.freeze();
}

export function buildSpectatorLeave(specId: UUID): BufferSource {
	return build(GameProtocol.SpectatorLeave)
		.writePrefixedUTF(specId)
		.freeze();
}

export function buildGameError(message: string): BufferSource {
	return build(GameProtocol.Error)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildGameFatalError(message: string): BufferSource {
	return build(GameProtocol.FatalError)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildBoard(board: Board) {
	return build(GameProtocol.Board)
		.writeBoard(board)
		.freeze();
}

export function buildMoveUpdate(/*player: Player, move: Position, */updates: PositionUpdate[]): BufferSource {
	const writer = build(GameProtocol.MoveUpdate)
		.writeUint32(updates.length);
	updates.forEach(p => {
		writer.writeUint8(p.content);
		writer.writeUint8(p.pos.row);
		writer.writeUint8(p.pos.col);
	});

	return writer.freeze();
}

export function buildBlackTurn(moves: Position[], timeToLose: number): BufferSource {
	const writer = build(GameProtocol.BlackTurn)
		.writeInt32(timeToLose)
		.writeUint32(moves.length);
	moves.forEach(m => {
		writer.writeUint8(m.row);
		writer.writeUint8(m.col);
	});

	return writer.freeze();
}

export function buildWhiteTurn(moves: Position[], timeToLose: number): BufferSource {
	const writer = build(GameProtocol.WhiteTurn)
		.writeInt32(timeToLose)
		.writeUint32(moves.length);
	moves.forEach(m => {
		writer.writeUint8(m.row);
		writer.writeUint8(m.col);
	});

	return writer.freeze();
}

export function buildBlackNoMoves(): BufferSource {
	return build(GameProtocol.BlackNoMoves)
		.freeze();
}

export function buildWhiteNoMoves(): BufferSource {
	return build(GameProtocol.WhiteNoMoves)
		.freeze();
}

export function buildGameEnd(game: GameSession): BufferSource {
	return build(GameProtocol.GameEnd)
		.writeUint8(!game.state.winner || game.state.winner === "DRAW" ? 0 : game.state.winner)
		.freeze();
}

export function buildXpUpdate(newXp: number): BufferSource {
	return build(GameProtocol.XpUpdate)
		.writeUint32(newXp)
		.freeze();
}

export function buildChatMessage(senderId: UUID, message: string): BufferSource {
	return build(GameProtocol.ChatMessage)
		.writePrefixedUTF(senderId)
		.writePrefixedUTF(message)
		.freeze();
}
