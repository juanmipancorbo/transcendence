import { Router } from "express";
import { login } from "./controller";
import { validateBody } from "@utils/validation-middelwares";
import { GoogleLoginReqSchema } from "@endpoints/users-request";

const router = Router();

router.post("/login", validateBody(GoogleLoginReqSchema), login);

export { router };
