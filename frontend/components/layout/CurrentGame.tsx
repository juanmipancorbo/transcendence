"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import { useWs } from "@/hooks/useWs";
import { gamesApi, userApi } from "@/lib/api";
import { GameData, PublicUser } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CurrentGame() {
	const { user, setUser } = useAuth();
	const { inGame } = useWs();
	const { error, message } = useMsg();
	const [game, setGame] = useState<GameData | null>(null);
	const [opponent, setOpponent] = useState<PublicUser | null>(null);
	const router = useRouter();

	useEffect(() => {
		if (!user || inGame || !user.currentGame) {
			setGame(null);
			setOpponent(null);
			return;
		}

		const gameId = user.currentGame;
		let cancelled = false;
		let checkingAssignment = false;

		const syncAssignment = async () => {
			if (checkingAssignment) return;
			checkingAssignment = true;
			try {
				const profile = await userApi.getProfile(user.id);
				if (cancelled || profile.currentGame === gameId) return;

				setGame(null);
				setOpponent(null);
				setUser({ ...user, currentGame: profile.currentGame });
				if (!profile.currentGame) message("Match ended while you were away");
			} catch {
				// A temporary request failure must not discard a live match.
			} finally {
				checkingAssignment = false;
			}
		};

		gamesApi.getGame(gameId)
			.then(g => {
				if (cancelled) return;
				setGame(g);
				const opponentId = g.whiteId === user.id ? g.blackId : g.whiteId;
				return userApi.getProfile(opponentId);
			})
			.then(p => { if (!cancelled && p) setOpponent(p); })
			.catch(() => syncAssignment());

		const interval = window.setInterval(syncAssignment, 5000);
		window.addEventListener("focus", syncAssignment);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
			window.removeEventListener("focus", syncAssignment);
		};
	}, [user?.id, user?.currentGame, inGame, message, setUser]);

	async function joinGame(id: string) {
		if (!user) return;
		try {
			const profile = await userApi.getProfile(user.id);
			if (profile.currentGame !== id) {
				setGame(null);
				setOpponent(null);
				setUser({ ...user, currentGame: profile.currentGame });
				message("Match ended while you were away");
				return;
			}
			router.push(`/game?id=${id}`);
		} catch (err) {
			error(err instanceof Error ? err.message : "Could not check the match");
		}
	}

	if (!game) return null;

	const opponentName = opponent?.username ?? "Opponent";
	const avatarUrl = opponent?.avatarUrl;

	return (
		<div
			onClick={() => joinGame(game.gameId)}
			title={`Rejoin your match vs ${opponentName}`}
			className="current-game-chip"
		>
			<div className="current-game-avatar">
				{avatarUrl ? (
					<img src={avatarUrl} alt={opponentName} className="h-full w-full object-cover" />
				) : (
					<span>{opponentName[0]?.toUpperCase() ?? "?"}</span>
				)}
			</div>
			<div className="current-game-copy">
				<span><i /> Live match</span>
				<strong>vs {opponentName}</strong>
			</div>
			<button onClick={event => { event.stopPropagation(); joinGame(game.gameId); }}>
				Rejoin &gt;
			</button>
		</div>
	);

}
