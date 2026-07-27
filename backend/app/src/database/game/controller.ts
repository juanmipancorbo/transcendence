import { GameReq, RecreatedGame } from "@endpoints/game-request";
import { SESSIONS } from "@gameLogic/sync/session";
import { Request, Response } from "express";
import { UUID } from "node:crypto";
import * as Service from "./service";
import { selectCompletedGame } from "./repository";
import { applyPlayerMove, BLACK, Board, createInitialGameState } from "@gameLogic/game";

export async function getGame(req: Request<GameReq>, res: Response) {
	const gameId = req.params.id;
	const gameData = SESSIONS.get(gameId as UUID);
	if (!gameData)
		return res.status(404).json({ success: false, data: "This game is not active or doesn't exist" });

	res.status(200).json({ success: true, data: {
		gameId,
		allowSpectators: gameData.allowSpectators,
		blackId: gameData.blackPlayer.id,
		whiteId: gameData.whitePlayer.id,
		friendly: gameData.friendly,
		timeLimitBlack: gameData.blackPlayer.timeLeft,
		timeLimitWhite: gameData.whitePlayer.timeLeft,
		winner: gameData.state.winner,
	} });
}

export async function getCompletedGame(req: Request<GameReq>, res: Response) {
	const data = await Service.readCompletedGame(req.params.id, req.userId!);
	res.status(200).json({ success: true, data });
}

export async function recreateGame(req: Request<GameReq>, res: Response) {
	const game = await selectCompletedGame(req.params.id, req.userId!);
	if (!game)
		return res.status(404).json({ success: false, data: "This game does not exist" });

	let state = createInitialGameState(game.black_player_id, game.white_player_id);
	const steps: Board[] = [state.board];

	for (const move of game.moves) {
		state = applyPlayerMove(
			state, move.player === BLACK ? game.black_player_id : game.white_player_id,
			move.row,
			move.col
		);
		steps.push(state.board);
	}

	const data: RecreatedGame = {
		...game,
		steps
	};

	res.status(200).json({ success: true, data });
}
