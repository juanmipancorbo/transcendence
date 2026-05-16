import type { Request, Response } from "express";
import * as Service from "./service";
import { LoginReq, RegisterReq } from "@endpoints/users-request";

export async function postRegister(req: Request<unknown, unknown, RegisterReq>, res: Response)
{
  await Service.createUser(req.body);
  res.status(201).json({success: true, data: null});
}

export async function postLogin(req: Request<unknown, unknown, LoginReq>, res: Response)
{
  const user = await Service.loginUser(req.body);
  if (user.password_hash)
    delete user.password_hash;
  res.status(200).json({success: true, data: user});
}