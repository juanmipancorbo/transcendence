import type { Request, Response } from "express";
import * as Service from "./service"
import type { NewGameReq, PostWinReq } from "@endpoints/game-request";

// TEST Controller DELETE in prod
export async function getGames(req: Request, res: Response)
{
  const ret = await Service.readAllGame();
  res.status(200).json({success: true, data: ret});
}

export async function newGame(req: Request<unknown, unknown, NewGameReq>, res: Response)
{
  await Service.createGame(req.body);
  res.status(201).json({success: true, data: null});
}

export async function postWinner(req: Request<unknown, unknown, PostWinReq>, res: Response)
{
  await Service.setWinner(req.body);
  res.status(201).json({success: true, data: null});
}