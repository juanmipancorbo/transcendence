import z from "zod";

export const FullUserSchema = z.strictObject({
  id: z.string(),
});

export type FullUser = z.infer<typeof FullUserSchema>;

export interface PublicUser {
  id: string,
  username: string,
  email: string,
};