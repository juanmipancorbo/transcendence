import z from "zod";

export const FullUserSchema = z.strictObject({
  id: z.string(),
});

export type FullUser = z.infer<typeof FullUserSchema>;

export interface PublicUser {
  id: string,
  username: string,
  email: string,
  avatar_url: string,
  current_game: string,
};

export interface User {
  id: string,
  username: string,
  email: string,
  password_hash: string,
  avatar_url: string,
  current_game: string,
  created_at: Date,
  updated_at: Date,
};

export interface AuthUser {
  id: string,
  username: string,
  email: string,
  password_hash?: string,
  // REMARK ?? token: string,
}