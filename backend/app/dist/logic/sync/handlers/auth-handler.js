"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protocol = void 0;
exports.default = onAuth;
const reader_1 = require("../stream-utils/reader");
const socket_1 = require("../socket");
const jwt_utils_1 = require("@utils/jwt-utils");
const socket_2 = require("../socket");
var Protocol;
(function (Protocol) {
    Protocol[Protocol["Token"] = 0] = "Token";
})(Protocol || (exports.Protocol = Protocol = {}));
function onAuth(data, conn, callback) {
    const reader = new reader_1.ByteReader(data);
    try {
        const typeId = reader.readUint8();
        if (typeId !== Protocol.Token)
            conn.close(socket_2.CloseCodes.Error, "Failed to authenticate");
        const token = reader.readPrefixedUTF();
        try {
            const payload = jwt_utils_1.tokenUtils.verifyAccessToken(token);
            conn.id = payload.id;
            conn.authenticated = true;
            (0, socket_1.registerSocket)(conn);
            callback();
        }
        catch (e) {
            conn.close(socket_2.CloseCodes.Error, `Invalid or expired token`);
        }
    }
    catch (_) {
        conn.close(socket_2.CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
    }
}
