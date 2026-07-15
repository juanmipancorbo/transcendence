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
			className="group relative flex h-10 cursor-pointer items-center gap-2.5 overflow-hidden rounded-full border border-primary/30 bg-surface-container-high/50 pl-1 pr-1.5 backdrop-blur-md transition-all duration-300 shadow-[0_0_18px_-6px_rgba(143,245,255,0.5)] hover:border-primary/60 hover:shadow-[0_0_26px_-2px_rgba(143,245,255,0.75)]"
		>
			<div
				className="pointer-events-none absolute inset-0 scale-150 bg-cover bg-center opacity-30 blur-xl saturate-150 transition-opacity duration-300 group-hover:opacity-50"
				style={avatarUrl
					? { backgroundImage: `url(${avatarUrl})` }
					: { background: "radial-gradient(circle at 30% 30%, var(--tertiary), transparent 70%)" }}
			/>
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface-container-high/85 via-surface-container-high/45 to-surface-container-high/85" />

			<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-primary/40 bg-surface-container-highest shadow-[0_0_10px_rgba(0,238,252,0.35)]">
				{avatarUrl ? (
					<img src={avatarUrl} alt={opponentName} className="h-full w-full object-cover" />
				) : (
					<div className="flex h-full w-full items-center justify-center font-headline text-sm font-black text-primary">
						{opponentName[0]?.toUpperCase() ?? "?"}
					</div>
				)}
			</div>

			<div className="relative flex min-w-0 flex-col leading-none">
				<div className="flex items-center gap-1">
					<span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
					<span className="font-headline text-[9px] font-black uppercase tracking-widest text-primary">
						Live
					</span>
				</div>
				<span className="max-w-[7rem] truncate text-xs font-semibold text-on-surface">
					vs {opponentName}
				</span>
			</div>
			<button
				onClick={e => { e.stopPropagation(); joinGame(game.gameId); }}
				className="relative flex max-w-0 items-center gap-1 overflow-hidden whitespace-nowrap rounded-full bg-primary-container/0 font-headline text-[10px] font-black uppercase tracking-wider text-primary opacity-0 transition-all duration-300 group-hover:max-w-[6rem] group-hover:bg-primary-container/15 group-hover:px-2.5 group-hover:py-1 group-hover:opacity-100"
			>
				<span className="material-symbols-outlined text-sm leading-none">play_arrow</span>
				Rejoin
			</button>
		</div>
	);
}
