import Router from "express"
import fs from "fs";
import path from "path";
import multer from "multer";
import { getProfile, updateAvatar, updateBio, updateUsername } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateBody, validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname) || ".jpg";
		const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
		cb(null, uniqueName);
	},
});

const upload = multer({
	storage,
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) return cb(null, true);
		cb(new Error("Only image files are allowed"));
	},
});

// Profile routes
router.get("/profile/:id", validateParams(EPSchema.ProfileReqSchema), getProfile);
router.patch("/username", authMiddleware, validateBody(EPSchema.FullUserReqSchema), updateUsername);
router.patch("/bio", authMiddleware, validateBody(EPSchema.UpdateBioReqSchema), updateBio);
router.post("/avatar", authMiddleware, upload.single("avatar"), updateAvatar);

export { router };