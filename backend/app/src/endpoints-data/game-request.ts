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

export type Move = {
  row: number;
  col: number;
  player: number;
};

export type FullGame = {
  id: string;
  white_player_id: string;
  black_player_id: string;
  time_left_white: number;
  time_left_black: number;
  friendly: boolean;
  allow_spectators: boolean;
  moves: Move[];
  winner_id: string | null;
  created_at: string | null;
  finished_at: string | null;
};
