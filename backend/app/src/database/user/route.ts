import Router from "express"
import { getAllUsers, getFullUser } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateParams } from "@utils/validation-middelwares";

const router = Router();

// TEST Route DELETE in prod
router.get("/admin/all", getAllUsers)
// TEST Route DELETE in prod
router.get("/admin/:username", validateParams(EPSchema.FullUserReqSchema), getFullUser)

export { router };