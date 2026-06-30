import z from "zod";

// Route param for a conversation: the other participant's id
// (GET /chats/:userId). The current user is taken from the auth token.
export const ChatHistoryParamReqSchema = z.strictObject({
  userId: z.uuid(),
});

export type ChatHistoryParamReq = z.infer<typeof ChatHistoryParamReqSchema>;

// Query params for paginating a conversation. `limit` caps how many messages
// come back; `before` is a cursor (a message's createdAt) to fetch the page of
// older messages preceding it. Both optional.
export const ChatHistoryQueryReqSchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.coerce.date().optional(),
});

export type ChatHistoryQueryReq = z.infer<typeof ChatHistoryQueryReqSchema>;
