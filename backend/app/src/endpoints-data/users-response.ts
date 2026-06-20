import { UUID } from "node:crypto";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
}

export interface FullUser {
	id: UUID,
	username: string,
	email: string,
	avatarUrl?: string,
	currentGame?: UUID,
	gamesPlayed: number,
	gamesWon: number,
	gamesLost: number,
	xp: number,
	level: number,
	createdAt: Date,
	updatedAt: Date
};

export interface Move {
	row: number,
	col: number,
	player: number
}

export interface GameData {
	id: UUID,
	white_player_id: UUID,
	black_player_id: UUID,
	time_left_white: number,
	time_left_black: number,
	friendly: boolean,
	allow_spectators: boolean,
	moves: Move[],
	winner_id: UUID | null
	created_at: Date,
	finished_at: Date | null
};

export type PublicUser = Pick<FullUser, "id" | "username" | "email" | "avatarUrl" | "gamesPlayed" | "gamesWon" | "gamesLost" | "xp" | "level">;

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken?: string;
}
