import { Position } from "@gameLogic/game";
import * as Repo from "./repository"
import { ApiError } from "@utils/error";
import { DatabaseError } from "pg";

export async function readGame(gameId: string) {
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw (new ApiError("Game not found", 404));
  return (game);
}

// TEST Service DELETE in prod
export async function readAllGame() {
  const game = await Repo.selectGameTable();
  if (!game)
    throw (new ApiError("GAME_TABLE_NOT_FOUND", 404));
  return (game);
}

export async function createGame({ gameId, whiteId, blackId, timeLimit, allowSpectators, friendly }: {
    gameId: string,
    whiteId: string,
    blackId: string,
	friendly: boolean,
    timeLimit: number, // TODO: set time limit
    allowSpectators: boolean // TODO: set if it allows spectators or not, basically if the game is public and others can see it or not
}) {
  try {
    await Repo.insertGame(gameId, whiteId, blackId, friendly, timeLimit, allowSpectators);
  } catch (err) {
    if (!(err instanceof DatabaseError) || err.code !== "23505") throw err;
    throw (new ApiError(`Failed to create game: Database: ${err.message}`, 409));
  }
}

export async function updateUserTimer(gameId: string, userId: string, timeLeft: number) {
	return Repo.updateUserTimer(gameId, userId, timeLeft);
}

export async function addGameMovement(gameId: string, userId: string, pos: Position) {
	return Repo.addGameMovement(gameId, userId, pos.row, pos.col);
}

export async function setUserTimeLeft(gameId: string, userId: string, timeLeft: number) {
	return Repo.updateUserTimer(gameId, userId, timeLeft);
}

export async function reportFinishedGame(gameId: string, winnerId: string | null): Promise<number | null> {
  const res = await Repo.reportFinishedGame(gameId, winnerId);
  if (!res)
    throw (new ApiError("WRONG_INFO", 400));
  return res;
}

export async function setWinner({gameId, winnerId}:{ gameId: string; winnerId?: string | undefined })
{
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw (new ApiError("Game not found", 404));
  if (winnerId != game.black_player_id || winnerId != game.white_player_id)
    throw (new ApiError("Ivalid player ID for this game", 403));
  await Repo.updateGameWinner(game.id, winnerId);
}
