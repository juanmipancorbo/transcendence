import { UUID } from "node:crypto";
import { PublicUser } from "@endpoints/users-response";
import { pool } from "@utils/pg-pool";
import { sql } from "@utils/sql";

export interface LeaderboardEntry {
	rank: number;
	user: PublicUser;
	wins: number;
	losses: number;
	xp: number;
	winRate: number;
}

type LeaderboardRow = {
	rank: number;
	id: UUID;
	username: string;
	avatarUrl?: string | null;
	bio: string;
	currentGame?: UUID | null;
	gamesPlayed: number;
	gamesWon: number;
	gamesLost: number;
	xp: number;
	level: number;
	createdAt: Date;
	wins: number;
	losses: number;
	winRate: number;
};

export async function selectTop(limit: number): Promise<LeaderboardEntry[]> {
	const res = await pool.query<LeaderboardRow>(sql`
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

	return res.rows.map(row => ({
		rank: row.rank,
		user: {
			id: row.id,
			username: row.username,
			avatarUrl: row.avatarUrl ?? undefined,
			bio: row.bio,
			status: "offline",
			currentGame: row.currentGame ?? undefined,
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
	}));
}
