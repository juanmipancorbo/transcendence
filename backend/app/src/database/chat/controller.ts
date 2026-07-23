import type { Request, Response } from "express";
import * as Service from "./service"
import type { ChatHistoryParamReq } from "@endpoints/chat-request";

// GET /chats/:userId — the conversation between the authenticated user and
// :userId. `limit` and `before` (validated by the router) drive pagination.
// req.query values arrive as strings, so coerce them here; validation already
// guaranteed they are well-formed.
export async function getChatHistory(req: Request<ChatHistoryParamReq>, res: Response) {
	const limit = req.query.limit ? Number(req.query.limit) : undefined;
	const before = req.query.before ? new Date(String(req.query.before)) : undefined;
	const data = await Service.readChatHistory(req.userId!, req.params.userId, limit, before);
	res.status(200).json({ success: true, data });
}

export async function getUnreadChats(req: Request, res: Response) {
	const data = await Service.readUnreadChats(req.userId!);
	res.status(200).json({ success: true, data });
}

export async function markChatRead(req: Request<ChatHistoryParamReq>, res: Response) {
	await Service.markConversationRead(req.userId!, req.params.userId);
	res.status(204).send();
}
