import { GameReq } from "@endpoints/game-request";
import { SESSIONS } from "@gameLogic/sync/session";
import { Request, Response } from "express";
import { UUID } from "node:crypto";

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
