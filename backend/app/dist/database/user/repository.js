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
exports.selectUserTable = selectUserTable;
exports.updateUsername = updateUsername;
exports.updateBio = updateBio;
exports.updateAvatar = updateAvatar;
exports.selectProfile = selectProfile;
exports.updateUserGame = updateUserGame;
exports.getUserCurrentGame = getUserCurrentGame;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
const PROFILE_DATA = `
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
// TEST Query DELETE in prod
function selectUserTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT * FROM users`);
        return (res.rows ? res.rows.map(d => { return Object.assign({ status: "offline" }, d); }) : null);
    });
}
function updateUsername(userId, newUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		UPDATE users SET username = $1 WHERE id = $2
	`, [newUsername, userId]);
        return res.rowCount != 0;
    });
}
function updateBio(userId, bio) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		UPDATE users SET bio = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, [bio, userId]);
        return res.rowCount != 0;
    });
}
function updateAvatar(userId, avatarUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		UPDATE users
		SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
		RETURNING avatar_url
	`, [avatarUrl, userId]);
        if (res.rowCount === 0 || !((_a = res.rows[0]) === null || _a === void 0 ? void 0 : _a.avatar_url)) {
            throw new Error("User not found");
        }
        return res.rows[0].avatar_url;
    });
}
function selectProfile(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT ${PROFILE_DATA}
      FROM users
    WHERE id = $1
  `, [userId]);
        return (res.rows[0] ? Object.assign(Object.assign({}, res.rows[0]), { status: "offline" }) : null);
    });
}
function updateUserGame(userId, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    UPDATE users
      SET current_game = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [userId, gameId]);
    });
}
function getUserCurrentGame(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT current_game FROM users WHERE id = $1
	`, [userId]);
        return (_b = (_a = res.rows[0]) === null || _a === void 0 ? void 0 : _a.current_game) !== null && _b !== void 0 ? _b : null;
    });
}
