import * as UserRepo from "../user/repository"
import * as Repo from "./repository"
import { DatabaseError } from "pg";

export async function readGame(gameId: string) {
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw ("INVALID_CREDENTIAL");
  return (game);
}

export async function createGame(gameId: string, whiteId: string, blackId: string) {
  const [whiteUser, blackUser] = await Promise.all([
    UserRepo.selectPublicUser(whiteId),
    UserRepo.selectPublicUser(blackId)]);
  if (!blackUser || !whiteUser)
    throw ("INVALID_CREDENTIAL")
  try {
    await Repo.insertGame(gameId, whiteId, blackId);
  } catch (err) {
    if (!(err instanceof DatabaseError) || err.code !== "23505") throw err;
    throw ("DUPLICATED_ENTITY");
  }
}

export async function setWinner(gameId: string, winnerId: string) {
  let game = await Repo.selectGame(gameId);
  if (!game)
    throw ("INVALID_CREDENTIAL");
  if (game.black_player_id != winnerId && game.white_player_id != winnerId)
    throw ("INVALID_CREDENTIAL");
  game = await Repo.updateWinner(gameId, winnerId);
  return (game);
}