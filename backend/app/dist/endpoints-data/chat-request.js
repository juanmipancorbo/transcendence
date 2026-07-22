"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryQueryReqSchema = exports.ChatHistoryParamReqSchema = void 0;
const zod_1 = __importDefault(require("zod"));
// Route param for a conversation: the other participant's id
// (GET /chats/:userId). The current user is taken from the auth token.
exports.ChatHistoryParamReqSchema = zod_1.default.strictObject({
    userId: zod_1.default.uuid(),
});
// Query params for paginating a conversation. `limit` caps how many messages
// come back; `before` is a cursor (a message's createdAt) to fetch the page of
// older messages preceding it. Both optional.
exports.ChatHistoryQueryReqSchema = zod_1.default.strictObject({
    limit: zod_1.default.coerce.number().int().min(1).max(100).optional(),
    before: zod_1.default.coerce.date().optional(),
});
