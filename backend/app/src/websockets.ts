import { createGameSession, GameSession, SESSIONS } from "./logic/sync/session";
import { UUID } from "node:crypto";
import { buildMatchFound } from "./logic/sync/protocol-utils";
import { CloseCodes, Socket } from "./logic/sync/socket";
import globalHandler from "./logic/sync/handlers/global-handler";
import gameHandler from "./logic/sync/handlers/game-handler";
import onAuth from "./logic/sync/handlers/auth-handler";
import { NextFunction, Request, Response } from "express";
import { WebSocket } from "ws";

function isUUID(value: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(value);
}

export function create(ws: WebSocket, _req: Request, _: NextFunction) {
	const client = new Socket(ws);
	client.handler = (data, conn) => {
		onAuth(data, conn, () => {
			client.handler = globalHandler;
			client.status = "online";
		});
	};
}

export function joinMiddl(req: Request, res: Response, next: NextFunction) {
	if (!req.query.gameId || !isUUID(req.query.gameId as string))
		return res.status(400).json({ success: false, data: "gameId query is required as uuid" });

	const gameId = req.query.gameId as string;
	const game = SESSIONS.get(gameId as UUID);
	if (!game)
		return res.status(404).json({ success: false, data: "This game does not exist" });

	(req as any).game = game;
	next();
}

export function join(ws: WebSocket, req: Request, _: NextFunction) {
	const client = new Socket(ws);
	client.handler = (data, conn) => {
		onAuth(data, conn, () => {
			const game: GameSession = (req as any).game;
			client.handler = gameHandler;
			client.status = "busy";
			const res = game.joinGame(client);
			if (res instanceof Error)
				client.close(CloseCodes.Error, res.message);
		});
	};
}
