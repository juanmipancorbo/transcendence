import { type Response, type Request } from "express";
import * as Service from "./service"
import { FullUserReq } from "@endpoints/users-request";

// Testing Controller DELETE in prod
export async function getFullUser(req: Request<FullUserReq>, res: Response){
  if (process.env.NODE_ENV !== "development")
  {
    res.status(400).json({ success: false, data: "Don't try"})
    return ;
  }
  const username = req.params.username;
  const data = await Service.readUserData(username);
  res.status(200).json({ success: true, data});
};

// Testing Controller DELETE in prod
export async function getAllUsers(req: Request, res: Response){
  if (process.env.NODE_ENV !== "development")
  {
    res.status(400).json({ success: false, data: "Don't try"})
    return ;
  }
  const data = await Service.readUserTable();
  res.status(200).json({ success: true, data});
};