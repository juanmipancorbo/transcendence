import { GameReqSchema } from "@endpoints/game-request";
import { validateParams } from "@utils/validation-middelwares";
import { authMiddleware } from "../../middleware/auth-middleware";
import { Router } from "express";
import { getCompletedGame, getGame, recreateGame } from "./controller";

const router = Router();

router.get("/:id/result", authMiddleware, validateParams(GameReqSchema), getCompletedGame);
router.get("/:id", validateParams(GameReqSchema), getGame);
router.get("/recreate/:id", validateParams(GameReqSchema), recreateGame);

export { router };
