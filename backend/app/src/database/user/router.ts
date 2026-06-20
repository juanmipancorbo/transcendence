import Router from "express"
import { getAllUsers, getFullUser, getProfile } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

// Profile routes
router.get("/profile/:id", validateParams(EPSchema.ProfileReqSchema), getProfile);
router.patch("/profile", authMiddleware, );

// TEST Route DELETE in prod
router.get("/admin/all", getAllUsers)
// TEST Route DELETE in prod
router.get("/admin/:username", validateParams(EPSchema.FullUserReqSchema), getFullUser)

export { router };
