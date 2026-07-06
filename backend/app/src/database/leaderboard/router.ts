import { Router } from "express";
import { getTop } from "./controller";

const router = Router();

router.get("/", getTop);

export { router };
