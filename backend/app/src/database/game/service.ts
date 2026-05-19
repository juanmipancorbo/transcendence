import { Position } from "../../../logic/game";
import { PositionUpdate } from "../../../logic/sync/session";
import * as UserRepo from "../user/repository"
import * as Repo from "./repository"
import { DatabaseError } from "pg";

export async function readGame(gameId: string) {
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw ("INVALID_CREDENTIAL");
  return (game);
}

// TEST Service DELETE in prod
export async function readAllGame() {
  const game = await Repo.selectGameTable();
  if (!game)
    throw ("INVALID_CREDENTIAL");
  return (game);
}

export async function createGame({ gameId, whiteId, blackId, timeLimit, allowSpectators }: {
    gameId: string,
    whiteId: string,
    blackId: string,
    timeLimit: number, // TODO: set time limit
    allowSpectators: boolean // TODO: set if it allows spectators or not, basically if the game is public and others can see it or not
}) {
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

export async function setWinner(
    {gameId, winnerId}: {gameId: string, winnerId: string}) {
  let game = await Repo.selectGame(gameId);
  if (!game)
    throw ("INVALID_CREDENTIAL");
  if (game.winner_id)
    throw ("MATCH_ALREADY_WON");
  if (game.black_player_id != winnerId && game.white_player_id != winnerId)
    throw ("PLAYER_NOT_IN_GAME");
  game = await Repo.updateWinner(gameId, winnerId);
  return (game);
}

// TODO: adds a move to the database for restore later, or for game review
export async function addGameMovement(gameId: string, userId: string, pos: Position, updates: PositionUpdate[]) {

}

export async function setUserTimeLeft(gameId: string, userId: string, timeLeft: number) {

}

export async function setFinished(gameId: string) {
	
}
