import Router from "express"
import { getProfile, updateBio, updateUsername } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateBody, validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Profile routes
router.get("/profile/:id", validateParams(EPSchema.ProfileReqSchema), getProfile);
router.patch("/username", authMiddleware, updateUsername);
router.patch("/bio", authMiddleware, validateBody(EPSchema.UpdateBioReqSchema), updateBio);

export { router };
