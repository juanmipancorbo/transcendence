"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = build;
exports.buildError = buildError;
exports.buildInfoMessage = buildInfoMessage;
exports.buildMatchFound = buildMatchFound;
exports.buildFriendRequest = buildFriendRequest;
exports.buildFriendChatMessage = buildFriendChatMessage;
exports.buildGameState = buildGameState;
exports.buildBlackAbandon = buildBlackAbandon;
exports.buildWhiteAbandon = buildWhiteAbandon;
exports.buildBlackDisconnect = buildBlackDisconnect;
exports.buildWhiteDisconnect = buildWhiteDisconnect;
exports.buildBlackReconnected = buildBlackReconnected;
exports.buildWhiteReconnected = buildWhiteReconnected;
exports.buildSpectatorJoin = buildSpectatorJoin;
exports.buildSpectatorLeave = buildSpectatorLeave;
exports.buildGameError = buildGameError;
exports.buildGameFatalError = buildGameFatalError;
exports.buildBoard = buildBoard;
exports.buildMoveUpdate = buildMoveUpdate;
exports.buildBlackTurn = buildBlackTurn;
exports.buildWhiteTurn = buildWhiteTurn;
exports.buildBlackNoMoves = buildBlackNoMoves;
exports.buildWhiteNoMoves = buildWhiteNoMoves;
exports.buildGameEnd = buildGameEnd;
exports.buildXpUpdate = buildXpUpdate;
exports.buildChatMessage = buildChatMessage;
const writer_1 = require("./stream-utils/writer");
const game_1 = require("../game");
const game_handler_1 = require("./handlers/game-handler");
const global_handler_1 = require("./handlers/global-handler");
function build(typeId) {
    return new writer_1.ByteWriter().writeUint8(typeId);
}
// Global
function buildError(message, code) {
    return build(global_handler_1.Protocol.Error)
        .writePrefixedUTF(message)
        .writeUint8(code !== null && code !== void 0 ? code : global_handler_1.ProtocolCodes.Generic)
        .freeze();
}
function buildInfoMessage(message) {
    return build(global_handler_1.Protocol.Info)
        .writePrefixedUTF(message)
        .freeze();
}
function buildMatchFound(game, opponent) {
    return build(global_handler_1.Protocol.MatchFound)
        .writePrefixedUTF(game.id)
        .writePrefixedUTF(opponent)
        .freeze();
}
function buildFriendRequest(from) {
    return build(global_handler_1.Protocol.FriendReqSend)
        .writePrefixedUTF(from)
        .freeze();
}
function buildFriendChatMessage(sender, message) {
    return build(global_handler_1.Protocol.Chat)
        .writePrefixedUTF(sender)
        .writePrefixedUTF(message)
        .freeze();
}
// In-Game
/**
* @param as: BLACK | WHITE, anything else means its as spectator
*/
function buildGameState(game, as) {
    const w = build(game_handler_1.Protocol.State)
        .writePrefixedUTF(game.id)
        .writeBoard(game.state.board)
        .writeUint8(as)
        .writePrefixedUTF(game.whitePlayer.id)
        .writePrefixedUTF(game.blackPlayer.id)
        .writeInt32(game.timeLimit)
        .writePrefixedUTF(game.state.status)
        .writeBool(game.allowSpectators);
    if (game.state.status === game_1.STATUS_ACTIVE) {
        w.writeUint8(game.state.currentTurn);
        w.writeUint32(game.startedAt);
        if (game.state.currentTurn === as) {
            const validMoves = (0, game_1.getValidMoves)(game.state.board, as);
            w.writeUint8(validMoves.length);
            for (const move of validMoves) {
                w.writeUint8(move.row);
                w.writeUint8(move.col);
            }
        }
    }
    return w.freeze();
}
function buildBlackAbandon() {
    return build(game_handler_1.Protocol.BlackAbandon).freeze();
}
function buildWhiteAbandon() {
    return build(game_handler_1.Protocol.WhiteAbandon).freeze();
}
function buildBlackDisconnect(reconnectTimeMs) {
    return build(game_handler_1.Protocol.BlackDisconnect)
        .writeUint32(reconnectTimeMs)
        .freeze();
}
function buildWhiteDisconnect(reconnectTimeMs) {
    return build(game_handler_1.Protocol.WhiteDisconnect)
        .writeUint32(reconnectTimeMs)
        .freeze();
}
function buildBlackReconnected() {
    return build(game_handler_1.Protocol.BlackReconnect).freeze();
}
function buildWhiteReconnected() {
    return build(game_handler_1.Protocol.WhiteReconnect).freeze();
}
function buildSpectatorJoin(specId) {
    return build(game_handler_1.Protocol.SpectatorJoin)
        .writePrefixedUTF(specId)
        .freeze();
}
function buildSpectatorLeave(specId) {
    return build(game_handler_1.Protocol.SpectatorLeave)
        .writePrefixedUTF(specId)
        .freeze();
}
function buildGameError(message) {
    return build(game_handler_1.Protocol.Error)
        .writePrefixedUTF(message)
        .freeze();
}
function buildGameFatalError(message) {
    return build(game_handler_1.Protocol.FatalError)
        .writePrefixedUTF(message)
        .freeze();
}
function buildBoard(board) {
    return build(game_handler_1.Protocol.Board)
        .writeBoard(board)
        .freeze();
}
function buildMoveUpdate(/*player: Player, move: Position, */ updates) {
    const writer = build(game_handler_1.Protocol.MoveUpdate)
        .writeUint32(updates.length);
    updates.forEach(p => {
        writer.writeUint8(p.content);
        writer.writeUint8(p.pos.row);
        writer.writeUint8(p.pos.col);
    });
    return writer.freeze();
}
function buildBlackTurn(moves, timeToLose) {
    const writer = build(game_handler_1.Protocol.BlackTurn)
        .writeInt32(timeToLose)
        .writeUint32(moves.length);
    moves.forEach(m => {
        writer.writeUint8(m.row);
        writer.writeUint8(m.col);
    });
    return writer.freeze();
}
function buildWhiteTurn(moves, timeToLose) {
    const writer = build(game_handler_1.Protocol.WhiteTurn)
        .writeInt32(timeToLose)
        .writeUint32(moves.length);
    moves.forEach(m => {
        writer.writeUint8(m.row);
        writer.writeUint8(m.col);
    });
    return writer.freeze();
}
function buildBlackNoMoves() {
    return build(game_handler_1.Protocol.BlackNoMoves)
        .freeze();
}
function buildWhiteNoMoves() {
    return build(game_handler_1.Protocol.WhiteNoMoves)
        .freeze();
}
function buildGameEnd(game) {
    return build(game_handler_1.Protocol.GameEnd)
        .writeUint8(!game.state.winner || game.state.winner === "DRAW" ? 0 : game.state.winner)
        .freeze();
}
function buildXpUpdate(newXp) {
    return build(game_handler_1.Protocol.XpUpdate)
        .writeUint32(newXp)
        .freeze();
}
function buildChatMessage(senderId, message) {
    return build(game_handler_1.Protocol.ChatMessage)
        .writePrefixedUTF(senderId)
        .writePrefixedUTF(message)
        .freeze();
}
