import { Router } from "express";
import expressWs from "express-ws";
import { createGameSession, GameConnection, resetTimeout } from "./logic/sync/session";
import { onMessageReceive, onPlayerAbandon, onPlayerDisconnect, Protocol } from "./logic/sync/protocol";
import { WebSocket } from "ws";
import { UUID } from "node:crypto";
import { BLACK, WHITE } from "./logic/game";
import { buildMatchFound } from "./logic/sync/protocol-utils";

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
		if (res.player && res.player.game) {
			if (code === Protocol.PlayerAbandon)
				onPlayerAbandon(res, res.player.game);
			else onPlayerDisconnect(res, res.player.game);
		}

	});
	res.on("error", async (err) => {
		console.error("Client was disconnected with an error: " + err.message);
		if (res.player && res.player.game)
			onPlayerDisconnect(res, res.player.game);
	})

	return res;
}

router.use("/quickplay", (req, res, next) => {
	const id = req.userId;
	if (quickplay && quickplay.id === id)
		return res.status(400).json({ success: false, data: "You are already in queue" });

	next();
});

router.ws("/quickplay",/* TODO: Token validation and ID injection */ async (ws, req, _) => {
	const client = setupGameConnection(ws, req.userId);
	if (!quickplay)
		quickplay = client;
	else {
		const game = createGameSession(quickplay, client, false /* TODO: Maybe take into account user settings */, 100);
		quickplay.send(buildMatchFound(game.id, WHITE, client.id));
		client.send(buildMatchFound(game.id, BLACK, quickplay.id));
		quickplay = null;
	}
});

export default router;
