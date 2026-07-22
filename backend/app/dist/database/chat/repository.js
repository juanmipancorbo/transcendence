"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectChatId = selectChatId;
exports.selectOrCreateChat = selectOrCreateChat;
exports.insertMessage = insertMessage;
exports.selectChatHistory = selectChatHistory;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
const MESSAGE_DATA = `id, chat_id AS "chatId", sender_id AS "senderId", content, created_at AS "createdAt"`;
// Id of the chat between two users, or null if they never talked.
function selectChatId(a, b) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT id FROM chats
		WHERE person1_id = LEAST($1::uuid, $2::uuid)
		  AND person2_id = GREATEST($1::uuid, $2::uuid)
	`, [a, b]);
        return ((_b = (_a = res.rows[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
    });
}
// Id of the chat between two users, creating it if it does not exist yet.
function selectOrCreateChat(a, b) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT get_or_create_chat($1, $2) AS id
	`, [a, b]);
        return (res.rows[0].id);
    });
}
// Store a message from sender to receiver and return the stored row (with its
// generated id and timestamp). The chat is created on first contact. All of it
// happens in a single query via the send_message() SQL function.
function insertMessage(senderId, receiverId, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT m.id, m.chat_id AS "chatId", m.sender_id AS "senderId", m.content, m.created_at AS "createdAt"
		FROM send_message($1, $2, $3) AS m
	`, [senderId, receiverId, content]);
        return (res.rows[0]);
    });
}
// One page of a conversation, newest message first. When `before` is given,
// only messages created strictly before it are returned (cursor pagination).
function selectChatHistory(chatId, limit, before) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT ${MESSAGE_DATA}
		FROM messages
		WHERE chat_id = $1
		  AND ($2::timestamp IS NULL OR created_at < $2::timestamp)
		ORDER BY created_at DESC
		LIMIT $3
	`, [chatId, before !== null && before !== void 0 ? before : null, limit]);
        return (res.rows);
    });
}
