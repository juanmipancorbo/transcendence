"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protocol = void 0;
exports.default = handler;
const socket_1 = require("../socket");
const reader_1 = require("../stream-utils/reader");
var Protocol;
(function (Protocol) {
    Protocol[Protocol["KeepAlive"] = 0] = "KeepAlive";
    Protocol[Protocol["ConsumeTurn"] = 1] = "ConsumeTurn";
    Protocol[Protocol["Ready"] = 2] = "Ready";
    Protocol[Protocol["ChatMessage"] = 3] = "ChatMessage";
    Protocol[Protocol["SpectatorJoin"] = 4] = "SpectatorJoin";
    Protocol[Protocol["SpectatorLeave"] = 5] = "SpectatorLeave";
    Protocol[Protocol["BlackTurn"] = 6] = "BlackTurn";
    Protocol[Protocol["WhiteTurn"] = 7] = "WhiteTurn";
    Protocol[Protocol["BlackNoMoves"] = 8] = "BlackNoMoves";
    Protocol[Protocol["WhiteNoMoves"] = 9] = "WhiteNoMoves";
    Protocol[Protocol["BlackAbandon"] = 10] = "BlackAbandon";
    Protocol[Protocol["WhiteAbandon"] = 11] = "WhiteAbandon";
    Protocol[Protocol["BlackDisconnect"] = 12] = "BlackDisconnect";
    Protocol[Protocol["WhiteDisconnect"] = 13] = "WhiteDisconnect";
    Protocol[Protocol["BlackReconnect"] = 14] = "BlackReconnect";
    Protocol[Protocol["WhiteReconnect"] = 15] = "WhiteReconnect";
    Protocol[Protocol["Abandon"] = 16] = "Abandon";
    Protocol[Protocol["Disconnect"] = 17] = "Disconnect";
    Protocol[Protocol["Board"] = 18] = "Board";
    Protocol[Protocol["State"] = 19] = "State";
    Protocol[Protocol["MoveUpdate"] = 20] = "MoveUpdate";
    Protocol[Protocol["GameStart"] = 21] = "GameStart";
    Protocol[Protocol["GameEnd"] = 22] = "GameEnd";
    Protocol[Protocol["XpUpdate"] = 23] = "XpUpdate";
    Protocol[Protocol["Error"] = 24] = "Error";
    Protocol[Protocol["FatalError"] = 25] = "FatalError";
})(Protocol || (exports.Protocol = Protocol = {}));
;
function onConsumeTurn(reader, game, conn) {
    if (!conn.player)
        return;
    const pos = { row: reader.readUint8(), col: reader.readUint8() };
    game.consumeTurn(conn, pos);
}
function onReady(_, game, _player, conn) {
    game.playerReady(conn);
}
function onChat(reader, game, conn) {
    const message = reader.readPrefixedUTF();
    game.chat(conn, message);
}
function onPlayerAbandon(_, game, _player, sock) {
    game.playerAbandon(sock);
}
function onPlayerDisconnect(_, game, _player, conn) {
    game.playerDisconnect(conn);
}
const callbacks = [];
callbacks[Protocol.ConsumeTurn] = onConsumeTurn;
callbacks[Protocol.Ready] = onReady;
callbacks[Protocol.ChatMessage] = onChat;
callbacks[Protocol.Abandon] = onPlayerAbandon;
callbacks[Protocol.Disconnect] = onPlayerDisconnect;
function handler(data, conn) {
    const reader = new reader_1.ByteReader(data);
    try {
        const typeId = reader.readUint8();
        if (typeId === Protocol.KeepAlive)
            conn.onKeepAlive();
        else if (conn.player && conn.player.game && callbacks[typeId])
            callbacks[typeId](reader, conn.player.game, conn.player, conn);
    }
    catch (_) {
        conn.close(socket_1.CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
    }
}
