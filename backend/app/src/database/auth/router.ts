import { LoginReqSchema, RegisterReqSchema } from "@endpoints/users-request";
import { validateBody } from "@utils/validation-middelwares";
import { Router } from "express";
import { postLogin, postRegister, getMe, postRefresh, postLogout } from "./controller";
import { authMiddleware } from "../../middleware/auth-middleware";

const router = Router();

router.post("/register", validateBody(RegisterReqSchema), postRegister);
router.post("/login", validateBody(LoginReqSchema), postLogin);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", postRefresh);
router.post("/logout", authMiddleware, postLogout);

export { router };