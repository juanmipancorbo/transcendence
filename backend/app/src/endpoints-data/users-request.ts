import z from "zod";

export const FullUserReqSchema = z.strictObject({
  username: z.string(),
});

export type FullUserReq = z.infer<typeof FullUserReqSchema>;