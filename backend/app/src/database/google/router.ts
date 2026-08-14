import { Router } from "express";
import { login, setupUsername } from "./controller";
import { validateBody } from "@utils/validation-middelwares";
import { GoogleLoginReqSchema, UserSetupReqSchema } from "@endpoints/users-request";

const router = Router();

router.post("/login", validateBody(GoogleLoginReqSchema), login);
router.post("/setup-username", validateBody(UserSetupReqSchema), setupUsername);

export { router };
