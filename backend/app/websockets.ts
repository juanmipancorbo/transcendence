import { Router } from "express";
import expressWs from "express-ws";
import { createGameSession, GameConnection, GameSession, resetTimeout, SESSIONS } from "./logic/sync/session";
import { onMessageReceive, Protocol } from "./logic/sync/protocol";
import { WebSocket } from "ws";
import { UUID } from "node:crypto";
import { buildMatchFound } from "./logic/sync/protocol-utils";

function isUUID(value: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

const router = Router();

expressWs(router as any);

export let quickplay: GameConnection | null = null;

export function unsetQuickplay() {
	quickplay = null;
}

function setupGameConnection(client: WebSocket, id: UUID): GameConnection {
	const res = client as GameConnection;
	res.lastKeepAlive = Date.now();
	res.id = id;
	resetTimeout(res);

	res.on("message", async (data, isBinary) => {
		if (!isBinary)
			return;

		onMessageReceive(data, res);
	});
	res.on("close", async (code, _) => {
		if (res.player) {
			if (code === Protocol.PlayerAbandon)
				res.player.game.playerAbandon(res);
			else res.player.game.playerDisconnect(res);
		}
	});
	res.on("error", async (err) => {
		console.error("Client was disconnected with an error: " + err.message);
		if (res.player)
			res.player.game.playerDisconnect(res);
	})

	return res;
}

router.use("/quickplay", (req, res, next) => {
	const id = req.userId;
	if (quickplay && quickplay.id === id)
		return res.status(400).json({ success: false, data: "You are already in queue" });

	next();
});

router.ws("/quickplay", async (ws, req, _) => {
	const client = setupGameConnection(ws, req.userId);
	if (!quickplay)
		quickplay = client;
	else {
		const game = createGameSession(quickplay.id, client.id, false /* TODO: Maybe take into account user settings */, 100);
		quickplay.send(buildMatchFound(game, client.id));
		client.send(buildMatchFound(game, quickplay.id));
		quickplay = null;
	}
});

router.use("/join", (req, res, next) => {
	if (!req.query.gameId || !isUUID(req.query.gameId as string))
		return res.status(400).json({ success: false, data: "gameId query is required as uuid" });
	const gameId = req.query.id as string;
	const game = SESSIONS.get(gameId as UUID);
	if (!game)
		res.status(404).json({ success: false, data: "This game does not exist" });
	(req as any).game = game;
	next();
});

router.ws("/join",/* TODO: Token validation and ID injection */ async (ws, req, _) => {
	const client = setupGameConnection(ws, req.userId);
	const game: GameSession = (req as any).game;
	const res = game.joinGame(client);
	if (res instanceof Error)
		client.close(Protocol.Error, res.message);
});

export default router;
