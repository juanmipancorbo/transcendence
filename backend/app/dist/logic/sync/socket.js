"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = exports.CloseCodes = void 0;
exports.registerSocket = registerSocket;
exports.unregisterSocket = unregisterSocket;
exports.getSocksById = getSocksById;
exports.injectStatus = injectStatus;
const node_crypto_1 = require("node:crypto");
const ws_1 = require("ws");
const global_handler_1 = require("./handlers/global-handler");
const global_handler_2 = __importDefault(require("./handlers/global-handler"));
var CloseCodes;
(function (CloseCodes) {
    CloseCodes[CloseCodes["Error"] = 4444] = "Error";
})(CloseCodes || (exports.CloseCodes = CloseCodes = {}));
function handle(e, sock) {
    if (sock.handler)
        sock.handler(e.data, sock);
}
const connectedUsers = new Map();
function registerSocket(sock) {
    const set = connectedUsers.get(sock.id);
    if (set) {
        set.add(sock);
    }
    else {
        const newSet = new Set();
        newSet.add(sock);
        connectedUsers.set(sock.id, newSet);
    }
}
function unregisterSocket(sock) {
    const sockSet = getSocksById(sock.id);
    if (!sockSet)
        return;
    sockSet.delete(sock);
    if (sockSet.size === 0)
        connectedUsers.delete(sock.id);
}
function getSocksById(id) { return connectedUsers.get(id); }
function injectStatus(users) {
    for (const user of users) {
        const sock = getSocksById(user.id);
        if (sock) {
            let busy = false;
            for (const client of sock) {
                if (client.status === "busy") {
                    busy = true;
                    break;
                }
            }
            user.status = busy ? "busy" : "online";
        }
        else
            user.status = "offline";
    }
}
class Socket {
    constructor(sock) {
        this.status = "offline";
        this.id = (0, node_crypto_1.randomUUID)();
        this.authenticated = false;
        this.ws = sock;
        this.lastKeepAlive = Date.now();
        this.resetTimeout();
        this.setup();
    }
    setup() {
        this.ws.onmessage = (e) => handle(e, this);
        this.ws.onclose = () => {
            if (global_handler_1.waiting && global_handler_1.waiting.id === this.id)
                (0, global_handler_1.unsetQuickplay)();
            if (this.player)
                this.player.game.playerDisconnect(this);
            unregisterSocket(this);
        };
        this.ws.onerror = (_) => {
            if (global_handler_1.waiting && global_handler_1.waiting.id === this.id)
                (0, global_handler_1.unsetQuickplay)();
            if (this.player)
                this.player.game.playerDisconnect(this);
            unregisterSocket(this);
        };
    }
    resetTimeout() {
        clearTimeout(this.pollTimeout);
        this.pollTimeout = setTimeout(() => {
            if (this.player)
                this.player.game.playerDisconnect(this);
            this.ws.close();
        }, 20000);
    }
    restoreGlobalState() {
        this.handler = global_handler_2.default;
        this.status = "online";
        this.player = undefined;
    }
    close(code, msg) {
        this.ws.close(code, msg);
    }
    send(data) {
        if (this.ws.readyState === ws_1.WebSocket.OPEN)
            this.ws.send(data);
    }
    onKeepAlive() {
        this.lastKeepAlive = Date.now();
        this.resetTimeout();
    }
    isConnectionAlive() {
        return Date.now() - this.lastKeepAlive < 20000; // Connection is considered dead after 20 seconds
    }
}
exports.Socket = Socket;
