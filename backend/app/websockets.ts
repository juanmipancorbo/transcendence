import { Router } from "express";
import expressWs from "express-ws";
import { GameConnection, resetTimeout } from "./logic/sync/session";
import { onMessageReceive } from "./logic/sync/protocol";
import { WebSocket } from "ws";
import { UUID } from "node:crypto";

const router = Router();

expressWs(router as any);

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
	res.on("close", async (code, reason) => {
		
	});
	res.on("error", async (err) => {
		
	})

	return res;
}

router.ws("/quickplay",/* TODO: Token validation and ID injection */ async (ws, req, _) => {
	const client = setupGameConnection(ws, );
});

export default router;
