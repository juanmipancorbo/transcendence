import Router from "express"
import { getProfile, updateUsername } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Profile routes
router.get("/profile/:id", validateParams(EPSchema.ProfileReqSchema), getProfile);
router.patch("/username", authMiddleware, updateUsername);

export { router };
