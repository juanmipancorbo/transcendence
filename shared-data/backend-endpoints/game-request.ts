import z from "zod"

export const NewGameReqSchema = z.strictObject({
  gameId: z.uuid(),
  whiteId: z.uuid(),
  blackId: z.uuid(),
});
export type NewGameReq = z.infer<typeof NewGameReqSchema>;

export const PostWinReqSchema = z.strictObject({
  gameId: z.uuid(),
  winnerId: z.uuid(),
});
export type PostWinReq = z.infer<typeof PostWinReqSchema>;