import { Router, type Request, type Response, type NextFunction} from "express"
import fs from "fs";
import path from "path";
import multer, { type FileFilterCallback} from "multer";
import { getProfile, updateAvatar, updateBio, updateUsername } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateBody, validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const mimeToExtension: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (_req, file, cb) => {
		const ext = mimeToExtension[file.mimetype] ?? ".jpg";
		const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
		cb(null, uniqueName);
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: MAX_AVATAR_SIZE_BYTES,
	},
	fileFilter: (_req, file, cb: FileFilterCallback) => {
		if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
		cb(new Error("Only JPG, PNG, and WebP images up to 5MB are allowed"));
	},
});

// Profile routes
router.get("/profile/:id", validateParams(EPSchema.ProfileReqSchema), getProfile);
router.patch("/username", authMiddleware, validateBody(EPSchema.FullUserReqSchema), updateUsername);
router.patch("/bio", authMiddleware, validateBody(EPSchema.UpdateBioReqSchema), updateBio);
router.post("/avatar", authMiddleware, (req: Request, res: Response, _next: NextFunction) => {
	upload.single("avatar")(req, res, (err: unknown) => {
		if (err) {
			const message = err instanceof multer.MulterError
				? (err.code === "LIMIT_FILE_SIZE"
					? "Image must be 5MB or smaller."
					: err.message)
				: err instanceof Error
					? err.message
					: "Unknown upload error";
			return res.status(400).json({ success: false, data: message });
		}
		return updateAvatar(req, res);
	});
});

export { router };
