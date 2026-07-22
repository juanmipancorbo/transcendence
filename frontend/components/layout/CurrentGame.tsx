"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import { useWs } from "@/hooks/useWs";
import { gamesApi, userApi } from "@/lib/api";
import { CompletedGameData, GameData, PublicUser } from "@/types";
import Avatar from "@/components/ui/Avatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PENDING_RESULT_KEY = "completedGameToView";

export default function CurrentGame() {
	const { user, setUser } = useAuth();
	const { inGame } = useWs();
	const { error, message } = useMsg();
	const [game, setGame] = useState<GameData | null>(null);
	const [endedGame, setEndedGame] = useState<CompletedGameData | null>(null);
	const [opponent, setOpponent] = useState<PublicUser | null>(null);
	const router = useRouter();

	useEffect(() => {
		if (!user || inGame || !user.currentGame) {
			if (inGame) {
				setGame(null);
				setEndedGame(null);
				setOpponent(null);
				sessionStorage.removeItem(PENDING_RESULT_KEY);
			}
			return;
		}

		const gameId = user.currentGame;
		let cancelled = false;
		let checkingAssignment = false;
		setEndedGame(null);
		sessionStorage.removeItem(PENDING_RESULT_KEY);

		const syncAssignment = async () => {
			if (checkingAssignment) return;
			checkingAssignment = true;
			try {
				const profile = await userApi.getProfile(user.id);
				if (cancelled || profile.currentGame === gameId) return;

				if (!profile.currentGame) {
					const result = await gamesApi.getResult(gameId);
					if (cancelled) return;
					setEndedGame(result);
					sessionStorage.setItem(PENDING_RESULT_KEY, gameId);
					message("Match ended while you were away");
				}

				setGame(null);
				setUser({ ...user, currentGame: profile.currentGame });
			} catch {
				// Temporary request failures must not discard a live match.
			} finally {
				checkingAssignment = false;
			}
		};

		gamesApi.getGame(gameId)
			.then(activeGame => {
				if (cancelled) return;
				setGame(activeGame);
				const opponentId = activeGame.whiteId === user.id ? activeGame.blackId : activeGame.whiteId;
				return userApi.getProfile(opponentId);
			})
			.then(profile => { if (!cancelled && profile) setOpponent(profile); })
			.catch(() => syncAssignment());

		const interval = window.setInterval(syncAssignment, 5000);
		window.addEventListener("focus", syncAssignment);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
			window.removeEventListener("focus", syncAssignment);
		};
	}, [user?.id, user?.currentGame, inGame, message, setUser]);

	useEffect(() => {
		if (!user || inGame || user.currentGame || endedGame) return;
		const gameId = sessionStorage.getItem(PENDING_RESULT_KEY);
		if (!gameId) return;

		let cancelled = false;
		gamesApi.getResult(gameId)
			.then(async result => {
				const opponentId = result.whiteId === user.id ? result.blackId : result.whiteId;
				const profile = await userApi.getProfile(opponentId);
				if (cancelled) return;
				setEndedGame(result);
				setOpponent(profile);
			})
			.catch(() => sessionStorage.removeItem(PENDING_RESULT_KEY));

		return () => { cancelled = true; };
	}, [user?.id, user?.currentGame, inGame]);

	async function joinGame(id: string) {
		if (!user) return;
		try {
			const profile = await userApi.getProfile(user.id);
			if (profile.currentGame !== id) {
				const result = await gamesApi.getResult(id);
				setGame(null);
				setEndedGame(result);
				setUser({ ...user, currentGame: profile.currentGame });
				sessionStorage.setItem(PENDING_RESULT_KEY, id);
				message("Match ended while you were away");
				return;
			}
			router.push("/game?id=" + id);
		} catch (err) {
			error(err instanceof Error ? err.message : "Could not check the match");
		}
	}

	function viewResult(id: string) {
		sessionStorage.removeItem(PENDING_RESULT_KEY);
		setEndedGame(null);
		router.push("/game/result?id=" + id);
	}

	const shownGame = endedGame ?? game;
	if (!shownGame) return null;

	const isEnded = endedGame !== null;
	const opponentName = opponent?.username ?? "Opponent";
	const avatarUrl = opponent?.avatarUrl;
	const open = () => isEnded ? viewResult(shownGame.gameId) : joinGame(shownGame.gameId);

	return (
		<div
			onClick={open}
			title={isEnded ? `View match result vs ${opponentName}` : `Rejoin your match vs ${opponentName}`}
			className={`current-game-chip ${isEnded ? "ended" : ""}`}
		>
			<Avatar avatarUrl={avatarUrl} name={opponentName} className="current-game-avatar" />
			<div className="current-game-copy">
				<span><i /> {isEnded ? "Match ended" : "Live match"}</span>
				<strong>vs {opponentName}</strong>
			</div>
			<button onClick={event => { event.stopPropagation(); open(); }}>
				{isEnded ? "View result >" : "Rejoin >"}
			</button>
		</div>
	);
}
