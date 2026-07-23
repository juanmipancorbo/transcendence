"use client";

import PixelLoader from "@/components/ui/PixelLoader";
import { useMsg } from "@/hooks/useMsg";
import { useWs } from "@/hooks/useWs";
import { userApi } from "@/lib/api";
import { buildDuelAccept } from "@/lib/ws/stream-utils";
import { DuelRequest, PublicUser } from "@/types";
import { useEffect, useState } from "react";

// Mirrors the delay the layout waits before dropping the request from the stack.
const EXPIRY_SECS = 15;

interface Props {
	duel: DuelRequest,
	onDismiss: () => void
}

function formatLimit(secs: number) {
	if (secs < 0) return "Unlimited time";
	return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")} per player`;
}

export default function DuelPrompt({ duel, onDismiss }: Props) {
	const { socket, inGame } = useWs();
	const { error } = useMsg();
	const [user, setUser] = useState<PublicUser | null>(null);

	useEffect(() => {
		userApi.getProfile(duel.from)
			.then(setUser)
			.catch(e => error(e.message));
	}, []);

	function onAccept() {
		onDismiss();
		if (inGame) return;
		socket.send(buildDuelAccept(duel.from));
	}

	return (
		<div className="pixel-duel animate-slide-up mb-2" role="alertdialog" aria-label="Duel request">
			<div className="pixel-duel-header">
				<span className="pixel-duel-marker" aria-hidden="true" />
				<p>Duel request</p>
			</div>

			<div className="pixel-duel-body">
				{user ? (
					<>
						<div className="pixel-duel-avatar">
							{user.avatarUrl
								? <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
								: <span>{user.username[0]?.toUpperCase() ?? "?"}</span>}
						</div>
						<div className="pixel-duel-copy">
							<p><strong>{user.username}</strong> is challenging you to a duel</p>
							<div className="pixel-duel-tags">
								<span>Lvl {user.level}</span>
								<span>{formatLimit(duel.secsLimit)}</span>
								<span className={duel.allowSpectators ? "on" : "off"}>
									Spectators {duel.allowSpectators ? "on" : "off"}
								</span>
							</div>
						</div>
					</>
				) : (
					<PixelLoader />
				)}
			</div>

			<div className="pixel-duel-actions">
				<button type="button" className="pixel-duel-accept" onClick={onAccept}>Accept</button>
				<button type="button" className="pixel-duel-reject" onClick={onDismiss}>Reject</button>
			</div>

			{/* Runs down over the lifetime of the request, so the deadline is visible. */}
			<div className="pixel-duel-timer" aria-hidden="true">
				<i style={{ animationDuration: `${EXPIRY_SECS}s` }} />
			</div>
		</div>
	);
}
