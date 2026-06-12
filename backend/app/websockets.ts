import { createGameSession, GameSession, SESSIONS } from "./logic/sync/session";
import { Router } from "express-ws";
import { UUID } from "node:crypto";
import { buildMatchFound } from "./logic/sync/protocol-utils";
import { CloseCodes, Socket } from "./logic/sync/socket";
import queueHandler from "./logic/sync/handlers/queue-handler";
import gameHandler, { Protocol as GameProtocol } from "./logic/sync/handlers/game-handler";
import onAuth from "./logic/sync/handlers/auth-handler";

function isUUID(value: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

export let quickplay: Socket | null = null;

export function unsetQuickplay() {
	quickplay = null;
}

export default function router(r: Router) {
	r.use("/quickplay", (req, res, next) => {
		const id = req.userId;
		if (quickplay && quickplay.id === id)
			return res.status(400).json({ success: false, data: "You are already in queue" });

		next();
	});

	r.ws("/quickplay", async (ws, _req, _) => {
		const client = new Socket(ws);
		client.handler = (data, conn) => {
			onAuth(data, conn, () => {
				client.handler = queueHandler;
				if (!quickplay) quickplay = client;
				else {
					const game = createGameSession(quickplay.id, client.id, false /* TODO: Maybe take into account user settings */, 100);
					quickplay.send(buildMatchFound(game, client.id));
					client.send(buildMatchFound(game, quickplay.id));
					client.close();
					quickplay.close();
					quickplay = null;
				}
			});
		};
	});

	r.use("/join", (req, res, next) => {
		if (!req.query.gameId || !isUUID(req.query.gameId as string))
			return res.status(400).json({ success: false, data: "gameId query is required as uuid" });
		const gameId = req.query.gameId as string;
		const game = SESSIONS.get(gameId as UUID);
		if (!game)
			return res.status(404).json({ success: false, data: "This game does not exist" });
		(req as any).game = game;
		next();
	});

	r.ws("/join", async (ws, req, _) => {
		const client = new Socket(ws);
		client.handler = (data, conn) => {
			onAuth(data, conn, () => {
				const game: GameSession = (req as any).game;
				client.handler = gameHandler;
				const res = game.joinGame(client);
				if (res instanceof Error)
					client.close(CloseCodes.Error, res.message);
			});
		};
	});
}
