import { Router } from "express";
import expressWs from "express-ws";
import { createGameSession, GameSession, SESSIONS } from "./logic/sync/session";
import { UUID } from "node:crypto";
import { buildMatchFound } from "./logic/sync/protocol-utils";
import { Socket } from "./logic/sync/socket";
import queueHandler from "./logic/sync/handlers/queue-handler";
import gameHandler, { Protocol as GameProtocol } from "./logic/sync/handlers/game-handler";
import { authMiddleware } from "./src/middleware/auth-middleware";

function isUUID(value: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

const router = Router();

expressWs(router as any);

export let quickplay: Socket | null = null;

export function unsetQuickplay() {
	quickplay = null;
}

router.use("/quickplay", authMiddleware, (req, res, next) => {
	const id = req.userId;
	if (quickplay && quickplay.id === id)
		return res.status(400).json({ success: false, data: "You are already in queue" });

	next();
});

router.ws("/quickplay", async (ws, req, _) => {
	const client = new Socket((req as any).userId, ws);
	if (!quickplay) {
		client.handler = queueHandler;
		quickplay = client;
	} else {
		const game = createGameSession(quickplay.id, client.id, false /* TODO: Maybe take into account user settings */, 100);
		quickplay.handler = gameHandler;
		quickplay.send(buildMatchFound(game, client.id));
		client.send(buildMatchFound(game, quickplay.id));
		quickplay = null;
	}
});

router.use("/join", authMiddleware, (req, res, next) => {
	if (!req.query.gameId || !isUUID(req.query.gameId as string))
		return res.status(400).json({ success: false, data: "gameId query is required as uuid" });
	const gameId = req.query.gameId as string;
	const game = SESSIONS.get(gameId as UUID);
	if (!game)
		return res.status(404).json({ success: false, data: "This game does not exist" });
	(req as any).game = game;
	next();
});

router.ws("/join",/* TODO: Token validation and ID injection */ async (ws, req, _) => {
	const client = new Socket((req as any).userId, ws);
	const game: GameSession = (req as any).game;
	const res = game.joinGame(client);
	if (res instanceof Error)
		client.close(GameProtocol.Error, res.message);
});

export default router;
