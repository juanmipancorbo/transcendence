import type { Request, Response } from "express";
import * as Service from "./service"
import type { FriendTargetReq, RespondRequestReq, FriendParamReq } from "@endpoints/friend-request";
import { injectStatus } from "@gameLogic/sync/socket";

export async function getFriends(req: Request, res: Response) {
	const data = await Service.readFriends(req.userId!);
	res.status(200).json({ success: true, data });
}

export async function getFriendProfiles(req: Request, res: Response) {
	const data = await Service.readFriendProfiles(req.userId!);
	injectStatus(...data);
	res.status(200).json({ success: true, data });
}

export async function getIncomingRequests(req: Request, res: Response) {
	const data = await Service.readIncomingRequests(req.userId!);
	injectStatus(...data);
	res.status(200).json({ success: true, data });
}

export async function getOutgoingRequests(req: Request, res: Response) {
	const data = await Service.readOutgoingRequests(req.userId!);
	injectStatus(...data);
	res.status(200).json({ success: true, data });
}

export async function getFriendStatus(req: Request<FriendParamReq>, res: Response) {
	const data = await Service.areFriends(req.userId!, req.params.id);
	res.status(200).json({ success: true, data });
}

export async function sendRequest(req: Request<unknown, unknown, FriendTargetReq>, res: Response) {
	await Service.sendFriendRequest(req.userId!, req.body.userId);
	res.status(201).json({ success: true, data: null });
}

export async function acceptRequest(req: Request<unknown, unknown, RespondRequestReq>, res: Response) {
	await Service.acceptFriendRequest(req.userId!, req.body.senderId);
	res.status(201).json({ success: true, data: null });
}

export async function declineRequest(req: Request<unknown, unknown, RespondRequestReq>, res: Response) {
	await Service.declineFriendRequest(req.userId!, req.body.senderId);
	res.status(200).json({ success: true, data: null });
}

export async function cancelRequest(req: Request<unknown, unknown, FriendTargetReq>, res: Response) {
	await Service.cancelFriendRequest(req.userId!, req.body.userId);
	res.status(200).json({ success: true, data: null });
}

export async function removeFriend(req: Request<unknown, unknown, FriendTargetReq>, res: Response) {
	await Service.removeFriend(req.userId!, req.body.userId);
	res.status(200).json({ success: true, data: null });
}
