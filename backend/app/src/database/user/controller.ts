import { type Response, type Request } from "express";
import * as Service from "./service"
import type { ProfileReq } from "@endpoints/users-request";
import { injectStatus } from "@gameLogic/sync/socket";

export async function getProfile(req: Request<ProfileReq>, res: Response) {
	const data = await Service.readProfile(req.params.id);
	injectStatus([data]);
	res.status(200).json({ success: true, data});
}

export async function updateUsername(req: Request, res: Response) {
	const newUsername = req.body.username;
	const userId = (req as any).userId;
	try {
		if (!(await Service.updateUsername(userId, newUsername)))
			return res.status(404).json({ success: false, data: "User likely doesn't exist" });
	} catch (e) { return res.status(500).json({ success: false, data: "Unknown error" }); }

	res.status(200).json({ success: true, data: null });
}
