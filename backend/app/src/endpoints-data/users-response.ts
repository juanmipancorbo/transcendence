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
	bio: string,
	status: "offline" | "online" | "busy",
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

export type PublicUser = Pick<FullUser, "id" | "username" | "avatarUrl" | "bio" | "status" | "currentGame" | "createdAt" | "gamesPlayed" | "gamesWon" | "gamesLost" | "xp" | "level">;

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken?: string;
}
