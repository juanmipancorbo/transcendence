import { Router } from "express";
import { getGames, newGame, postWinner } from "./controller";
import { validateBody } from "@utils/validation-middelwares";
import { NewGameReqSchema, PostWinReqSchema } from "@endpoints/game-request";

const router = Router();

// TEST Route DELETE in prod
router.get("/admin/all", getGames);

router.post("/new", validateBody(NewGameReqSchema), newGame);
router.post("/winner", validateBody(PostWinReqSchema), postWinner);

export { router };