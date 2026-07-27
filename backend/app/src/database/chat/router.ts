import { Router } from "express";
import { getChatHistory, getUnreadChats, markChatRead } from "./controller";
import * as EPSchema from "@endpoints/chat-request";
import { validateParams, validateQuery } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Every chat action is scoped to the authenticated user.
router.use(authMiddleware);

router.get("/unread", getUnreadChats);

router.patch("/:userId/read",
	validateParams(EPSchema.ChatHistoryParamReqSchema),
	markChatRead);

// Conversation history with another user. Sending messages is handled over the
// websocket layer, not here.
router.get("/:userId",
	validateParams(EPSchema.ChatHistoryParamReqSchema),
	validateQuery(EPSchema.ChatHistoryQueryReqSchema),
	getChatHistory);

export { router };
