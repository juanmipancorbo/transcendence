"use client";

import { useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import { useWs } from "@/hooks/useWs";
import { gamesApi, userApi } from "@/lib/api";
import { GameData, PublicUser } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CurrentGame() {
	const { user } = useAuth();
	const { inGame } = useWs();
	const { error } = useMsg();
	const [game, setGame] = useState<GameData | null>(null);
	const [opponent, setOpponent] = useState<PublicUser | null>(null);
	const router = useRouter();

	useEffect(() => {
		if (!user || inGame || !user.currentGame) {
			setGame(null);
			setOpponent(null);
			return;
		}

		let cancelled = false;
		gamesApi.getGame(user.currentGame)
			.then(g => {
				if (cancelled) return;
				setGame(g);
				const opponentId = g.whiteId === user.id ? g.blackId : g.whiteId;
				return userApi.getProfile(opponentId);
			})
			.then(p => { if (!cancelled && p) setOpponent(p); })
			.catch(e => error(e.message));

		return () => { cancelled = true; };
	}, [user?.currentGame, inGame]);

	function joinGame(id: string) {
		router.push(`/game?id=${id}`);
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
