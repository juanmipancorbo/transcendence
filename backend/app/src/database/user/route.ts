import Router from "express"
import { getAllUsers, getFullUser } from "./controller";
import * as EPSchema from "@endpoints/users-request"
import { validateBody, validateParams } from "@utils/validation-middelwares";

const router = Router();

router.get("/admin/all", getAllUsers)
router.get("/admin/:user", validateParams(EPSchema.FullUserReqSchema), getFullUser)