import { LoginReqSchema, RegisterReqSchema } from "@endpoints/users-request";
import { validateBody } from "@utils/validation-middelwares";
import { Router } from "express";
import { postLogin, postRegister } from "./controller";

const router = Router();

router.post("/register", validateBody(RegisterReqSchema), postRegister);
router.post("/login", validateBody(LoginReqSchema), postLogin);

export { router };