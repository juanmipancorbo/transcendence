import { Socket } from "./logic/sync/socket";
import onAuth from "./logic/sync/handlers/auth-handler";
import { NextFunction, Request } from "express";
import { WebSocket } from "ws";

export function create(ws: WebSocket, _req: Request, _: NextFunction) {
	const client = new Socket(ws);
	client.handler = (data, conn) => {
		onAuth(data, conn, () => client.restoreGlobalState());
	};
}
