"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
const socket_1 = require("./logic/sync/socket");
const auth_handler_1 = __importDefault(require("./logic/sync/handlers/auth-handler"));
function create(ws, _req, _) {
    const client = new socket_1.Socket(ws);
    client.handler = (data, conn) => {
        (0, auth_handler_1.default)(data, conn, () => client.restoreGlobalState());
    };
}
