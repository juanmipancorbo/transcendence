"use client";

import { BLACK, FullGame } from "@/types"
import { useRouter } from "next/navigation";
import { useState } from "react"

interface MatchEntryProps {
	game: FullGame;
	ownerId?: string;
	opponent: string;
}

export default function MatchEntry({ game, ownerId, opponent }: MatchEntryProps) {
	const router = useRouter();
	const [open, setOpen] = useState<boolean>(false);

	const outcome = !game.finished_at ? "ongoing"
		: !game.winner_id ? "draw"
		: game.winner_id === ownerId ? "win" : "loss";
	const playedBlack = game.black_player_id === ownerId;
	const moves = game.moves ?? [];
	const blackMoves = moves.filter(move => move.player === BLACK).length;

	const details: [string, string][] = [
		["Played as", playedBlack ? "Black" : "White"],
		["Total moves", String(moves.length)],
		["Moves B / W", `${blackMoves} / ${moves.length - blackMoves}`],
		["Duration", game.finished_at
			? formatMs(new Date(game.finished_at).getTime() - new Date(game.created_at).getTime())
			: "In progress"],
		["Mode", game.friendly ? "Friendly" : "Casual"],
	];

	return <li className={`match-entry ${outcome}`}>
		<div className="match-entry-row">
			<button type="button" className="match-entry-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
				<span className={`match-entry-tag ${outcome}`}>{outcome}</span>
				<span className="match-entry-name">vs {opponent}</span>
				<span className="match-entry-date">{new Date(game.created_at).toLocaleDateString()}</span>
				<span className="match-entry-caret" aria-hidden="true">{open ? "▼" : "▶"}</span>
			</button>
			<button type="button" className="match-entry-review" onClick={() => router.push(`/review?gameId=${game.id}`)}>
				Review
			</button>
		</div>

		{open && <dl className="match-entry-details">
			{details.map(([label, value]) => <div key={label}>
				<dt>{label}</dt>
				<dd>{value}</dd>
			</div>)}
		</dl>}
	</li>
}

function formatMs(ms: number) {
	const seconds = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}
