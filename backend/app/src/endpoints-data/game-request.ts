import z from "zod";

export const NewGameReqSchema = z.strictObject({
  gameId: z.uuid(),
  whiteId: z.uuid(),
  blackId: z.uuid(),
  timeLimit: z.number(),
  allowSpectators: z.boolean(),
  friendly: z.boolean(),
});

export const PostWinReqSchema = z.strictObject({
  gameId: z.string(),
  winnerId: z.string().optional()
});

export type NewGameReq = z.infer<typeof NewGameReqSchema>;
export type PostWinReq = z.infer<typeof PostWinReqSchema>;
