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
exports.insertGame = insertGame;
exports.selectGame = selectGame;
exports.updateUserTimer = updateUserTimer;
exports.addGameMovement = addGameMovement;
exports.reportFinishedGame = reportFinishedGame;
exports.selectCompletedGame = selectCompletedGame;
exports.updateGameWinner = updateGameWinner;
exports.getUnfinishedGames = getUnfinishedGames;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
const GAME_DATA = `
	id as gameId,
	white_player_id as whiteId,
	black_player_id as blackId,
	time_left_white as timeLimitWhite,
	time_left_black as timeLimitBlack,
	allow_spectators as allowSpectators,
	friendly,
	winner_id as winnerId
`;
function insertGame(gameId, whiteId, blackId, friendly, time, allowSpectators) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    INSERT INTO games (id, white_player_id, black_player_id, time_left_white, time_left_black, friendly, allow_spectators)
      VALUES ($1, $2, $3, $4, $4, $5, $6)
  `, [gameId, whiteId, blackId, time, friendly, allowSpectators]);
    });
}
function selectGame(gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const ret = yield pg_pool_1.pool.query((0, sql_1.sql) `
    SELECT ${GAME_DATA} FROM games
      WHERE id = $1
  `, [gameId]);
        return ((_a = ret.rows[0]) !== null && _a !== void 0 ? _a : null);
    });
}
function updateUserTimer(gameId, userId, timeLeft) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT update_time_left($1, $2, $3)
	`, [gameId, userId, timeLeft]);
    });
}
function addGameMovement(gameId, userId, row, col) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT add_game_movement($1, $2, $3, $4)
	`, [gameId, userId, row, col]);
    });
}
function reportFinishedGame(gameId, winner) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
	WITH report AS MATERIALIZED (
		SELECT report_game($1, $2) AS xp
	)
	UPDATE games
		SET finished_at = COALESCE(finished_at, CURRENT_TIMESTAMP)
		WHERE id = $1
	RETURNING (SELECT xp FROM report) AS xp
  `, [gameId, winner]);
        return (_b = (_a = res.rows[0]) === null || _a === void 0 ? void 0 : _a.xp) !== null && _b !== void 0 ? _b : null;
    });
}
function selectCompletedGame(gameId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.winner_id,
			COALESCE(g.finished_at, g.created_at) AS finished_at,
			COALESCE(
				(SELECT json_agg(
					json_build_object('row', m.row, 'col', m.col, 'player', m.player)
					ORDER BY ord
				)
				FROM unnest(g.moves) WITH ORDINALITY AS m(row, col, player, ord)),
				'[]'
			) AS moves
		FROM games g
		WHERE g.id = $1
			AND (g.finished_at IS NOT NULL OR g.winner_id IS NOT NULL)
			AND $2 IN (g.black_player_id, g.white_player_id)
	`, [gameId, userId]);
        return (_a = res.rows[0]) !== null && _a !== void 0 ? _a : null;
    });
}
function updateGameWinner(gameId, winnerId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield pg_pool_1.pool.query((0, sql_1.sql) `
    UPDATE games
      SET winner_id = $2, finished_at = CURRENT_TIMESTAMP
    WHERE id = $1
`, [gameId, winnerId]);
    });
}
function getUnfinishedGames() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT
			g.id,
			g.black_player_id,
			g.white_player_id,
			g.allow_spectators,
			g.friendly,
			g.time_left_black,
			g.time_left_white,
		COALESCE(
			(SELECT json_agg(
				json_build_object('row', m.row, 'col', m.col, 'player', m.player)
				ORDER BY ord
			)
			FROM unnest(g.moves) WITH ORDINALITY AS m(row, col, player, ord)),
			'[]'
		) AS moves
		FROM games g
		WHERE g.finished_at IS NULL
			AND g.winner_id IS NULL;
	`);
        return res.rows;
    });
}
