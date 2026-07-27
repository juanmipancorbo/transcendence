import { Router, type Request, type Response, type NextFunction } from "express"
import multer, { type FileFilterCallback } from "multer";
import { getMatchHistory, getProfile, getPublicMatchHistory, updateAvatar, updateBio, updateUsername } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateBody, validateParams, validateQuery } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
	storage: multer.memoryStorage(),
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
router.get("/match-history", authMiddleware, validateQuery(EPSchema.PageReqSchema), getMatchHistory);
router.get("/match-history/:id", validateParams(EPSchema.ProfileReqSchema), validateQuery(EPSchema.PageReqSchema), getPublicMatchHistory);
router.patch("/username", authMiddleware, validateBody(EPSchema.FullUserReqSchema), updateUsername);
router.patch("/bio", authMiddleware, validateBody(EPSchema.UpdateBioReqSchema), updateBio);
router.post("/avatar", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
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
		next();
	});
}, updateAvatar);

export { router };
