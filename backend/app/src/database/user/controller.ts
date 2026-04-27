import { type Response, type Request } from "express";
import * as Service from "./service"
import { FullUserReq } from "@endpoints/users-request";

export function getAllUsers(){

};

export function getFullUser(req: Request<FullUserReq>, res: Response){
  const username = req.params.username;
  const data = Service.readUserData(username);
  res.json();
};