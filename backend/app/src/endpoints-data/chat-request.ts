import z from "zod";

export const ChatHistoryParamReqSchema = z.strictObject({
  userId: z.uuid(),
});

export type ChatHistoryParamReq = z.infer<typeof ChatHistoryParamReqSchema>;

export const ChatHistoryQueryReqSchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.coerce.date().optional(),
});

export type ChatHistoryQueryReq = z.infer<typeof ChatHistoryQueryReqSchema>;
