"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waiting = exports.ProtocolCodes = exports.Protocol = void 0;
exports.unsetQuickplay = unsetQuickplay;
exports.default = handler;
const reader_1 = require("../stream-utils/reader");
const socket_1 = require("../socket");
const session_1 = require("../session");
const game_handler_1 = __importDefault(require("./game-handler"));
const protocol_utils_1 = require("../protocol-utils");
const service_1 = require("@databaseAccess/friend/service");
const service_2 = require("@databaseAccess/chat/service");
const repository_1 = require("@databaseAccess/user/repository");
var Protocol;
(function (Protocol) {
    Protocol[Protocol["KeepAlive"] = 0] = "KeepAlive";
    Protocol[Protocol["JoinCasualQueue"] = 1] = "JoinCasualQueue";
    Protocol[Protocol["LeaveQueue"] = 2] = "LeaveQueue";
    Protocol[Protocol["FriendReqSend"] = 3] = "FriendReqSend";
    Protocol[Protocol["FriendReqReject"] = 4] = "FriendReqReject";
    Protocol[Protocol["FriendReqAccept"] = 5] = "FriendReqAccept";
    Protocol[Protocol["Chat"] = 6] = "Chat";
    Protocol[Protocol["JoinGame"] = 7] = "JoinGame";
    Protocol[Protocol["MatchFound"] = 8] = "MatchFound";
    Protocol[Protocol["Info"] = 9] = "Info";
    Protocol[Protocol["Error"] = 10] = "Error";
    Protocol[Protocol["Notification"] = 11] = "Notification";
})(Protocol || (exports.Protocol = Protocol = {}));
var ProtocolCodes;
(function (ProtocolCodes) {
    ProtocolCodes[ProtocolCodes["Generic"] = 0] = "Generic";
    ProtocolCodes[ProtocolCodes["FriendReqFailed"] = 1] = "FriendReqFailed";
    ProtocolCodes[ProtocolCodes["QueueFailed"] = 2] = "QueueFailed";
})(ProtocolCodes || (exports.ProtocolCodes = ProtocolCodes = {}));
exports.waiting = null;
function unsetQuickplay() {
    exports.waiting = null;
}
function onKeepAlive(_, conn) {
    conn.onKeepAlive();
}
function onQueueCasual(_, conn) {
    (0, repository_1.getUserCurrentGame)(conn.id).then(currentGame => {
        if (currentGame !== null)
            return conn.send((0, protocol_utils_1.buildError)("You can't join a queue while you are in a game", ProtocolCodes.QueueFailed));
        conn.status = "busy";
        if (!exports.waiting) {
            exports.waiting = conn;
            return;
        }
        else if (exports.waiting.id === conn.id)
            return conn.send((0, protocol_utils_1.buildError)("You are already in queue", ProtocolCodes.QueueFailed));
        const game = (0, session_1.createGameSession)(exports.waiting.id, conn.id, true /* TODO: Maybe take into account user settings */, false, 180);
        const tmp = exports.waiting;
        exports.waiting = null;
        tmp.send((0, protocol_utils_1.buildMatchFound)(game, conn.id));
        conn.send((0, protocol_utils_1.buildMatchFound)(game, tmp.id));
    }).catch(_ => conn.send((0, protocol_utils_1.buildError)("Failed to check current game state", ProtocolCodes.QueueFailed)));
}
function onQueueLeave(_, conn) {
    if (exports.waiting && exports.waiting.id === conn.id)
        exports.waiting = null;
    else
        conn.send((0, protocol_utils_1.buildError)("You are not in any queue"));
}
function onFriendRequestSend(p, conn) {
    const to = p.readPrefixedUTF();
    (0, service_1.sendFriendRequest)(conn.id, to).then(() => {
        conn.send((0, protocol_utils_1.buildInfoMessage)("Friend request sent"));
        const online = (0, socket_1.getSocksById)(to);
        if (online) {
            const req = (0, protocol_utils_1.buildFriendRequest)(conn.id);
            for (const client of online) {
                if (client.status === "online")
                    client.send(req);
            }
        }
    }).catch(e => conn.send((0, protocol_utils_1.buildError)(`Failed to send friend request: ${e.message}`, ProtocolCodes.FriendReqFailed)));
}
function onFriendRequestReject(p, conn) {
    const sender = p.readPrefixedUTF();
    (0, service_1.declineFriendRequest)(conn.id, sender).then(() => {
        conn.send((0, protocol_utils_1.buildInfoMessage)("Friend request declined"));
        const online = (0, socket_1.getSocksById)(sender);
        if (online) {
            for (const client of online) {
                if (client.status === "online")
                    client.send((0, protocol_utils_1.buildInfoMessage)("Your friend request got rejected"));
            }
        }
    }).catch(e => {
        conn.send((0, protocol_utils_1.buildError)(`Failed to decline request: ${e.message}`));
    });
}
function onFriendRequestAccept(p, conn) {
    const sender = p.readPrefixedUTF();
    (0, service_1.declineFriendRequest)(conn.id, sender).then(() => {
        conn.send((0, protocol_utils_1.buildInfoMessage)("Friend request accepted"));
        const online = (0, socket_1.getSocksById)(sender);
        if (online) {
            const notice = (0, protocol_utils_1.buildInfoMessage)("Your friend request was accepted!");
            for (const client of online) {
                if (client.status === "online")
                    client.send(notice);
            }
        }
    }).catch(e => {
        conn.send((0, protocol_utils_1.buildError)(`Failed to accept request: ${e.message}`));
    });
}
function onChat(p, conn) {
    const to = p.readPrefixedUTF();
    const message = p.readPrefixedUTF();
    const connections = (0, socket_1.getSocksById)(to);
    if (connections && [...connections].some(client => client.status === "busy")) {
        conn.send((0, protocol_utils_1.buildError)("This player is currently in a game"));
        return;
    }
    (0, repository_1.getUserCurrentGame)(to)
        .then(currentGame => {
        if (currentGame !== null) {
            conn.send((0, protocol_utils_1.buildError)("This player is currently in a game"));
            return;
        }
        return (0, service_2.addChatMessage)(conn.id, to, message).then(() => {
            const online = (0, socket_1.getSocksById)(to);
            if (!online)
                return;
            const msg = (0, protocol_utils_1.buildFriendChatMessage)(conn.id, message);
            for (const client of online) {
                if (client.status === "online")
                    client.send(msg);
            }
        });
    })
        .catch(e => conn.send((0, protocol_utils_1.buildError)(`Failed to send message: ${e.message}`)));
}
function onJoinGame(p, conn) {
    const gameId = p.readPrefixedUTF();
    const game = session_1.SESSIONS.get(gameId);
    if (!game) {
        conn.send((0, protocol_utils_1.buildGameFatalError)("Game doesn't exist"));
        return;
    }
    const isQueuedPlayer = game.whitePlayer.id === conn.id || game.blackPlayer.id === conn.id;
    if (conn.status === "busy" && !isQueuedPlayer) {
        conn.send((0, protocol_utils_1.buildGameFatalError)("Cannot join a game while in queue"));
        return;
    }
    conn.handler = game_handler_1.default;
    conn.status = "busy";
    const res = game.joinGame(conn);
    if (res instanceof Error) {
        conn.handler = handler;
        conn.status = "online";
        conn.send((0, protocol_utils_1.buildGameFatalError)(res.message));
    }
}
const callbacks = [];
callbacks[Protocol.KeepAlive] = onKeepAlive;
callbacks[Protocol.JoinCasualQueue] = onQueueCasual;
callbacks[Protocol.LeaveQueue] = onQueueLeave;
callbacks[Protocol.FriendReqSend] = onFriendRequestSend;
callbacks[Protocol.FriendReqReject] = onFriendRequestReject;
callbacks[Protocol.FriendReqAccept] = onFriendRequestAccept;
callbacks[Protocol.Chat] = onChat;
callbacks[Protocol.JoinGame] = onJoinGame;
function handler(data, conn) {
    const reader = new reader_1.ByteReader(data);
    try {
        const typeId = reader.readUint8();
        if (callbacks[typeId])
            callbacks[typeId](reader, conn);
    }
    catch (_) {
        conn.close(socket_1.CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
    }
}
