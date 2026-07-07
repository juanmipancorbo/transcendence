"use client";

import { useEffect, useState } from "react";
import { leaderboardApi } from "@/lib/api";

export function useGlobalRank(userId?: string) {
	const [rank, setRank] = useState<number | null>(null);

	useEffect(() => {
		let cancelled = false;
		if (!userId) {
			setRank(null);
			return;
		}

		leaderboardApi.getTop(100)
			.then(entries => {
				if (cancelled) return;
				setRank(entries.find(entry => entry.user.id === userId)?.rank ?? null);
			})
			.catch(() => {
				if (!cancelled) setRank(null);
			});

		return () => { cancelled = true; };
	}, [userId]);

	return rank;
}
