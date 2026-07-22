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
exports.insertFriendRequest = insertFriendRequest;
exports.deleteFriendRequest = deleteFriendRequest;
exports.selectFriendRequest = selectFriendRequest;
exports.selectIncomingRequests = selectIncomingRequests;
exports.selectOutgoingRequests = selectOutgoingRequests;
exports.insertFriend = insertFriend;
exports.deleteFriend = deleteFriend;
exports.selectAreFriends = selectAreFriends;
exports.selectFriends = selectFriends;
exports.selectFriendProfiles = selectFriendProfiles;
exports.acceptFriendRequest = acceptFriendRequest;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
const FRIEND_DATA = `
  id,
  username,
  email,
  avatar_url AS "avatarUrl",
  bio,
  current_game AS "currentGame",
  games_played AS "gamesPlayed",
  games_won AS "gamesWon",
  games_lost AS "gamesLost",
  xp,
  level
`;
function insertFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		INSERT INTO friend_requests (sender_id, receiver_id)
		VALUES ($1, $2)
	`, [senderId, receiverId]);
    });
}
function deleteFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		DELETE FROM friend_requests
		WHERE sender_id = $1 AND receiver_id = $2
	`, [senderId, receiverId]);
    });
}
function selectFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT 1 FROM friend_requests
		WHERE sender_id = $1 AND receiver_id = $2
	`, [senderId, receiverId]);
        return (res.rows.length > 0);
    });
}
function selectIncomingRequests(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT ${FRIEND_DATA}
		FROM friend_requests fr
		JOIN users u ON u.id = fr.sender_id
		WHERE fr.receiver_id = $1
		ORDER BY fr.created_at DESC
	`, [userId]);
        return res.rows.map(d => { return Object.assign({ status: "offline" }, d); });
    });
}
function selectOutgoingRequests(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT ${FRIEND_DATA}
		FROM friend_requests fr
		JOIN users u ON u.id = fr.receiver_id
		WHERE fr.sender_id = $1
		ORDER BY fr.created_at DESC
	`, [userId]);
        return res.rows.map(d => { return Object.assign({ status: "offline" }, d); });
    });
}
function insertFriend(userId, friendId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		INSERT INTO friends (user1_id, user2_id)
		VALUES ($1, $2)
	`, [userId, friendId]);
    });
}
function deleteFriend(userId, friendId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		DELETE FROM friends
		WHERE user1_id = LEAST($1::uuid, $2::uuid)
		AND user2_id = GREATEST($1::uuid, $2::uuid)
	`, [userId, friendId]);
    });
}
function selectAreFriends(userId, friendId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT are_friends($1, $2) AS "areFriends"
	`, [userId, friendId]);
        return ((_b = (_a = res.rows[0]) === null || _a === void 0 ? void 0 : _a.areFriends) !== null && _b !== void 0 ? _b : false);
    });
}
// Just the ids of every friend of userId.
function selectFriends(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END AS id
		FROM friends f
		WHERE f.user1_id = $1 OR f.user2_id = $1
	`, [userId]);
        return (res.rows.map((row) => row.id));
    });
}
// PublicUser profile of every friend of userId.
function selectFriendProfiles(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT ${FRIEND_DATA}
		FROM friends f
		JOIN users u ON u.id = CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END
		WHERE f.user1_id = $1 OR f.user2_id = $1
		ORDER BY f.created_at DESC
	`, [userId]);
        return res.rows.map(d => { return Object.assign({ status: "offline" }, d); });
    });
}
// Accept an incoming request atomically: drop the pending row and create the
// friendship in one transaction so we never end up with one without the other.
function acceptFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pg_pool_1.pool.connect();
        try {
            yield client.query("BEGIN");
            yield client.query((0, sql_1.sql) `
			DELETE FROM friend_requests
			WHERE sender_id = $1 AND receiver_id = $2
		`, [senderId, receiverId]);
            yield client.query((0, sql_1.sql) `
			INSERT INTO friends (user1_id, user2_id)
			VALUES ($1, $2)
		`, [senderId, receiverId]);
            yield client.query("COMMIT");
        }
        catch (err) {
            yield client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    });
}
