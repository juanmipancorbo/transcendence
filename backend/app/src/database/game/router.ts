import { GameReqSchema } from "@endpoints/game-request";
import { validateParams } from "@utils/validation-middelwares";
import { Router } from "express";
import { getGame } from "./controller";

const router = Router();

router.get("/:id", validateParams(GameReqSchema), getGame);

export { router };
