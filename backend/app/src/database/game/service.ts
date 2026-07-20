import { applyPlayerMove, BLACK, countPieces, createInitialGameState, Position, WHITE } from "@gameLogic/game";
import * as Repo from "./repository"
import type { CompletedGameData } from "@endpoints/game-request";
import { ApiError } from "@utils/error";
import { DatabaseError } from "pg";

export async function readGame(gameId: string) {
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw (new ApiError("Game not found", 404));
  return (game);
}

export async function createGame({ gameId, whiteId, blackId, timeLimit, allowSpectators, friendly }: {
    gameId: string,
    whiteId: string,
    blackId: string,
	friendly: boolean,
    timeLimit: number,
    allowSpectators: boolean
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
  return Repo.reportFinishedGame(gameId, winnerId);
}

export async function readCompletedGame(gameId: string, userId: string): Promise<CompletedGameData> {
  const game = await Repo.selectCompletedGame(gameId, userId);
  if (!game)
    throw new ApiError("Completed game not found", 404);

  let state = createInitialGameState(game.black_player_id, game.white_player_id);
  for (const move of game.moves) {
    const playerId = move.player === BLACK ? game.black_player_id : game.white_player_id;
    state = applyPlayerMove(state, playerId, move.row, move.col);
  }

  const scores = countPieces(state.board);
  const winner = game.winner_id === game.black_player_id
    ? BLACK
    : game.winner_id === game.white_player_id ? WHITE : 0;

  return {
    gameId: game.id,
    whiteId: game.white_player_id,
    blackId: game.black_player_id,
    winner,
    board: state.board,
    scores,
    finishedAt: game.finished_at!,
  };
}

export async function setWinner({gameId, winnerId}:{ gameId: string; winnerId?: string | undefined })
{
  const game = await Repo.selectGame(gameId);
  if (!game)
    throw (new ApiError("Game not found", 404));
  if (winnerId !== game.blackId && winnerId !== game.whiteId)
    throw (new ApiError("Ivalid player ID for this game", 403));
  await Repo.updateGameWinner(game.gameId, winnerId);
}
