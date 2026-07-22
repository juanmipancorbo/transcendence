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
exports.insertUser = insertUser;
exports.insertUserGoogle = insertUserGoogle;
exports.selectAuthUser = selectAuthUser;
exports.selectUserById = selectUserById;
exports.selectFullUserById = selectFullUserById;
exports.selectFullUserByEmail = selectFullUserByEmail;
exports.selectUserByUsername = selectUserByUsername;
exports.saveRefreshToken = saveRefreshToken;
exports.deleteRefreshToken = deleteRefreshToken;
exports.deleteAllUserSessions = deleteAllUserSessions;
exports.findRefreshToken = findRefreshToken;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
const USER_DATA = `
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
  level,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;
function insertUser(email, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    INSERT INTO users (email, username, password_hash, account_host)
      VALUES ($1, $2, $3, 'local')
  `, [email, username, password]);
    });
}
function insertUserGoogle(email, username, avatar) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    INSERT INTO users (email, username, account_host, avatar_url)
      VALUES ($1, $2, 'google', $3)
      RETURNING ${USER_DATA}
  `, [email, username, avatar !== null && avatar !== void 0 ? avatar : 'NULL']);
        return (Object.assign(Object.assign({}, ret.rows[0]), { status: "offline" }));
    });
}
function selectAuthUser(email) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT id, username, email, password_hash FROM users
      WHERE email = $1
  `, [email]);
        return ((_a = ret.rows[0]) !== null && _a !== void 0 ? _a : null);
    });
}
function selectUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT id, username, email, password_hash FROM users
      WHERE id = $1
  `, [id]);
        return ((_a = ret.rows[0]) !== null && _a !== void 0 ? _a : null);
    });
}
function selectFullUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT ${USER_DATA} FROM users
      WHERE id = $1
  `, [id]);
        return (ret.rows[0] ? Object.assign(Object.assign({}, ret.rows[0]), { status: "offline" }) : null);
    });
}
function selectFullUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT ${USER_DATA} FROM users
      WHERE email = $1
  `, [email]);
        return (ret.rows[0] ? Object.assign(Object.assign({}, ret.rows[0]), { status: "offline" }) : null);
    });
}
function selectUserByUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT id, username, email, password_hash FROM users
      WHERE username = $1
  `, [username]);
        return ((_a = ret.rows[0]) !== null && _a !== void 0 ? _a : null);
    });
}
function saveRefreshToken(userId, tokenHash, expiresAt) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3)
  `, [userId, tokenHash, expiresAt]);
    });
}
function deleteRefreshToken(userId, tokenHash) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    DELETE FROM auth_sessions WHERE user_id = $1 AND refresh_token_hash = $2
  `, [userId, tokenHash]);
    });
}
function deleteAllUserSessions(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    DELETE FROM auth_sessions WHERE user_id = $1
  `, [userId]);
    });
}
function findRefreshToken(userId, tokenHash) {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT 1 FROM auth_sessions 
      WHERE user_id = $1 AND refresh_token_hash = $2 AND expires_at > NOW()
  `, [userId, tokenHash]);
        return ret.rows.length > 0;
    });
}
