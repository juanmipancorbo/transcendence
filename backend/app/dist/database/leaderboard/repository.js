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
exports.selectTop = selectTop;
const pg_pool_1 = require("@utils/pg-pool");
const sql_1 = require("@utils/sql");
function selectTop(limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield pg_pool_1.pool.query((0, sql_1.sql) `
		SELECT
			ROW_NUMBER() OVER (
				ORDER BY xp DESC, games_won DESC, games_lost ASC, username ASC
			)::int AS rank,
			id,
			username,
			avatar_url AS "avatarUrl",
			bio,
			current_game AS "currentGame",
			games_played AS "gamesPlayed",
			games_won AS "gamesWon",
			games_lost AS "gamesLost",
			xp,
			level,
			created_at AS "createdAt",
			games_won AS wins,
			games_lost AS losses,
			CASE
				WHEN games_won + games_lost = 0 THEN 0
				ELSE ROUND((games_won::numeric / (games_won + games_lost)) * 100)::int
			END AS "winRate"
		FROM users
		ORDER BY xp DESC, games_won DESC, games_lost ASC, username ASC
		LIMIT $1
	`, [limit]);
        return res.rows.map(row => {
            var _a, _b;
            return ({
                rank: row.rank,
                user: {
                    id: row.id,
                    username: row.username,
                    avatarUrl: (_a = row.avatarUrl) !== null && _a !== void 0 ? _a : undefined,
                    bio: row.bio,
                    status: "offline",
                    currentGame: (_b = row.currentGame) !== null && _b !== void 0 ? _b : undefined,
                    createdAt: row.createdAt,
                    gamesPlayed: row.gamesPlayed,
                    gamesWon: row.gamesWon,
                    gamesLost: row.gamesLost,
                    xp: row.xp,
                    level: row.level,
                },
                wins: row.wins,
                losses: row.losses,
                xp: row.xp,
                winRate: row.winRate,
            });
        });
    });
}
