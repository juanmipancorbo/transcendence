import { Winner } from "@gameLogic/game";
import z from "zod";

export const GameReqSchema = z.strictObject({
	id: z.uuid(),
});

export type GameReq = z.infer<typeof GameReqSchema>;

export type GameData = {
  gameId: string,
  whiteId: string,
  blackId: string,
  timeLimitBlack: number,
  timeLimitWhite: number,
  allowSpectators: number,
  friendly: number,
  winner: Winner,
};
