import { randomUUID } from "crypto";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { type NextFunction, type Response, type Request } from "express";
import sharp from "sharp";
import * as Service from "./service"
import type { FullUserReq, ProfileReq, UpdateBioReq, UsernameReq } from "@endpoints/users-request";
import { injectStatus } from "@gameLogic/sync/socket";
import { ApiError } from "@utils/error";
import { isUsernameAvailable } from "./repository";
import { STATUS_CODES } from "http";

const avatarDir = path.resolve(process.cwd(), "uploads", "avatars");
const localAvatarPrefix = "/api/uploads/avatars/";
const legacyAvatarPrefix = "/uploads/avatars/";
const MAX_AVATAR_PIXELS = 4096 * 4096;

function isLocalAvatarUrl(avatarUrl?: string) {
	return Boolean(avatarUrl?.startsWith(localAvatarPrefix) || avatarUrl?.startsWith(legacyAvatarPrefix));
}

async function removeLocalAvatar(avatarUrl?: string) {
	if (!isLocalAvatarUrl(avatarUrl)) return;
	const relativePath = avatarUrl?.startsWith(legacyAvatarPrefix)
		? avatarUrl.slice(legacyAvatarPrefix.length)
		: avatarUrl?.slice(localAvatarPrefix.length) ?? "";
	await unlink(path.join(avatarDir, path.basename(relativePath))).catch(() => {});
}

export async function getProfile(req: Request<ProfileReq>, res: Response) {
	const data = await Service.readProfile(req.params.id);
	injectStatus([data]);
	res.status(200).json({ success: true, data});
}

export async function getMatchHistory(req: Request, res: Response) {
	const before = req.query.before ? new Date(req.query.before as string) : new Date();
	const limit = req.query.limit ? Number(req.query.limit) : 20;
	const data = await Service.getMatchHistory(req.userId!, limit, before);

	res.status(200).json({ success: true, data });
}

export async function getPublicMatchHistory(req: Request<ProfileReq>, res: Response) {
	const before = req.query.before ? new Date(req.query.before as string) : new Date();
	const limit = req.query.limit ? Number(req.query.limit) : 20;
	const data = await Service.getPublicMatchHistory(req.params.id, limit, before);

	res.status(200).json({ success: true, data });
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

export async function updateAvatar(req: Request, res: Response, next: NextFunction) {
	const userId = req.userId;
	const file = req.file;

	if (!userId)
		return res.status(401).json({ success: false, data: "User not authenticated" });
	if (!file?.buffer)
		return res.status(400).json({ success: false, data: "No image file provided" });

	await mkdir(avatarDir, { recursive: true });
	const filename = `${randomUUID()}.webp`;
	const outputPath = path.join(avatarDir, filename);

	try {
		await sharp(file.buffer, { limitInputPixels: MAX_AVATAR_PIXELS, failOn: "warning" })
			.rotate()
			.resize(512, 512, { fit: "cover", position: "attention" })
			.webp({ quality: 80, effort: 4 })
			.toFile(outputPath);
	} catch {
		await unlink(outputPath).catch(() => {});
		return next(new ApiError("Invalid or unsupported image file", 400));
	}

	try {
		const avatarUrl = `${localAvatarPrefix}${filename}`;
		const result = await Service.updateAvatar(userId, avatarUrl);
		await removeLocalAvatar(result.previousAvatarUrl);
		return res.status(200).json({ success: true, data: { avatarUrl: result.avatarUrl } });
	} catch (error) {
		await unlink(outputPath).catch(() => {});
		return next(error);
	}
}

export async function checkUsernameAvailability(req: Request<UsernameReq>, res: Response) {
	const isAvailable = await isUsernameAvailable(req.params.username);
	if (isAvailable)
		return res.status(400).json({ success: false, data: "This username is already in use" });
	res.status(200).json({ success: true, data: null });
}
