import z from "zod";

// Send / cancel a friend request, or remove an existing friend: the other
// user is identified by their id.
export const FriendTargetReqSchema = z.strictObject({
  userId: z.uuid(),
});

export type FriendTargetReq = z.infer<typeof FriendTargetReqSchema>;

// Accept / decline an incoming request: identified by the user who sent it.
export const RespondRequestReqSchema = z.strictObject({
  senderId: z.uuid(),
});

export type RespondRequestReq = z.infer<typeof RespondRequestReqSchema>;

// Route param for friendship lookups (/friends/status/:id).
export const FriendParamReqSchema = z.strictObject({
  id: z.uuid(),
});

export type FriendParamReq = z.infer<typeof FriendParamReqSchema>;
