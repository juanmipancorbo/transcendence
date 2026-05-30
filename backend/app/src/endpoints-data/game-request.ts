import z from "zod";

export const NewGameReqSchema = z.strictObject({
  id: z.string().optional()
});

export const PostWinReqSchema = z.strictObject({
  gameId: z.string(),
  winnerId: z.string().optional()
});

export type NewGameReq = z.infer<typeof NewGameReqSchema>;
export type PostWinReq = z.infer<typeof PostWinReqSchema>;
