import { Request, Response } from "express";
import { injectStatus } from "@gameLogic/sync/socket";
import * as Service from "./service";

export async function getTop(req: Request, res: Response) {
	const data = await Service.readTop(req.query.limit);
	injectStatus(...data.map(entry => entry.user));
	res.status(200).json({ success: true, data });
}
