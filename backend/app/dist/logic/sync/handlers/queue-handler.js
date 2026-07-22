"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protocol = void 0;
exports.default = handler;
const reader_1 = require("../stream-utils/reader");
const socket_1 = require("../socket");
var Protocol;
(function (Protocol) {
    Protocol[Protocol["KeepAlive"] = 0] = "KeepAlive";
    Protocol[Protocol["MatchFound"] = 1] = "MatchFound";
    Protocol[Protocol["MatchmakeError"] = 2] = "MatchmakeError";
})(Protocol || (exports.Protocol = Protocol = {}));
function handler(data, conn) {
    const reader = new reader_1.ByteReader(data);
    try {
        const typeId = reader.readUint8();
        if (typeId === Protocol.KeepAlive)
            conn.onKeepAlive();
    }
    catch (_) {
        conn.close(socket_1.CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
    }
}
