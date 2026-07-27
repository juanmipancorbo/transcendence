"use client";

import MatchEntry from "@/components/layout/MatchEntry";
import PixelLoader from "@/components/ui/PixelLoader";
import { useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import { userApi } from "@/lib/api";
import { FullGame } from "@/types"
import { useCallback, useEffect, useRef, useState } from "react"

const PAGE_SIZE = 20;

interface MatchHistoryProps extends React.ComponentProps<'div'> {
	userId?: string
}

export default function MatchHistory({ userId, className, ...rest }: MatchHistoryProps) {
	const { user } = useAuth();
	const { error } = useMsg();
	const [games, setGames] = useState<FullGame[]>([]);
	const [names, setNames] = useState<Map<string, string>>(new Map());
	const [loading, setLoading] = useState<boolean>(true);
	const [final, setFinal] = useState<boolean>(false);
	const end = useRef<HTMLDivElement>(null);

	// Whose history is shown: the given profile, or the logged in user by default.
	const ownerId = userId ?? user?.id;
	const opponentOf = (game: FullGame) => game.black_player_id === ownerId ? game.white_player_id : game.black_player_id;

	const load = useCallback(async (before?: Date) => {
		if (!ownerId) return;

		setLoading(true);
		try {
			const page = userId
				? await userApi.getPublicMatchHistory(userId, PAGE_SIZE, before)
				: await userApi.getMatchHistory(PAGE_SIZE, before);

			// Games only carry player ids, so opponent names are resolved separately.
			const opponents = [...new Set(page.map(game => game.black_player_id === ownerId ? game.white_player_id : game.black_player_id))];
			const profiles = await Promise.all(opponents.map(id => userApi.getProfile(id).catch(() => null)));

			setNames(prev => new Map([...prev, ...profiles.filter(p => p !== null).map(p => [p.id, p.username] as const)]));
			setGames(prev => before ? [...prev, ...page] : page);
			setFinal(page.length < PAGE_SIZE);
		} catch (err) {
			setFinal(true);
			error(err instanceof Error ? err.message : "Could not load match history");
		} finally {
			setLoading(false);
		}
	}, [userId, ownerId, error]);

	useEffect(() => { load(); }, [load]);

	// Pull the next page once the bottom of the list comes into view.
	useEffect(() => {
		const node = end.current;
		if (!node || final || loading || games.length === 0) return;

		const observer = new IntersectionObserver(
			entries => { if (entries[0].isIntersecting) load(new Date(games[games.length - 1].created_at)); },
			{ rootMargin: "120px" },
		);
		observer.observe(node);

		return () => observer.disconnect();
	}, [final, loading, games, load]);

	return <div className={`match-history ${className ?? ""}`} {...rest}>
		<h2>Match History</h2>

		{games.length === 0 && !loading && <p className="match-history-empty">No matches played yet</p>}

		<ul className="match-history-list">
			{games.map(game => <MatchEntry
				key={game.id}
				game={game}
				ownerId={ownerId}
				opponent={names.get(opponentOf(game)) ?? "Unknown"}
			/>)}
		</ul>

		<div ref={end} className="match-history-foot">
			{loading && <PixelLoader label="Loading matches" />}
		</div>
	</div>
}
