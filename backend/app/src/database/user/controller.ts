import { type Response, type Request } from "express";
import * as Service from "./service"
import type { FullUserReq, ProfileReq, UpdateBioReq } from "@endpoints/users-request";
import { injectStatus } from "@gameLogic/sync/socket";

export async function getProfile(req: Request<ProfileReq>, res: Response) {
	const data = await Service.readProfile(req.params.id);
	injectStatus([data]);
	res.status(200).json({ success: true, data});
}

export async function updateUsername(req: Request<unknown, unknown, FullUserReq>, res: Response) {
	if (!(await Service.updateUsername(req.userId!, req.body.username)))
		return res.status(404).json({ success: false, data: "User likely doesn't exist" });

	res.status(200).json({ success: true, data: null });
}

export async function updateBio(req: Request<unknown, unknown, UpdateBioReq>, res: Response) {
	if (!(await Service.updateBio(req.userId!, req.body.bio)))
		return res.status(404).json({ success: false, data: "User likely doesn't exist" });

	res.status(200).json({ success: true, data: null });
}
