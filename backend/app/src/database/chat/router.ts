import { Router } from "express";
import { getChatHistory } from "./controller";
import * as EPSchema from "@endpoints/chat-request";
import { validateParams, validateQuery } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Every chat action is scoped to the authenticated user.
router.use(authMiddleware);

// Conversation history with another user. Sending messages is handled over the
// websocket layer, not here.
router.get("/:userId",
	validateParams(EPSchema.ChatHistoryParamReqSchema),
	validateQuery(EPSchema.ChatHistoryQueryReqSchema),
	getChatHistory);

export { router };
