"use client";

import { useEffect, useRef, useState } from "react";
import { Chat, useWs } from "@/hooks/useWs";
import { useMsg } from "@/hooks/useMsg";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import { buildFriendChat } from "@/lib/ws/stream-utils";
import { PublicUser } from "@/types";

interface ChatWindowProps {
	chat: Chat;
	onClose: () => void;
}

export default function ChatWindow({ chat, onClose }: ChatWindowProps) {
	const { socket } = useWs();
	const { error } = useMsg();
	const { user } = useAuth();

	const [friend, setFriend] = useState<PublicUser | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	const [draft, setDraft] = useState("");
	const [loadingHistory, setLoadingHistory] = useState(false);

	const bottomRef = useRef<HTMLDivElement>(null);

	const messages = chat.messages;
	const hasMore = !chat.isFinal;

	// The Chat itself carries no profile info, so the header still needs its own
	// fetch for the friend's username/avatar/status.
	useEffect(() => {
		let cancelled = false;
		userApi.getProfile(chat.friendId).then(p => { if (!cancelled) setFriend(p); }).catch(() => {});
		return () => { cancelled = true; };
	}, [chat.friendId]);

	useEffect(() => {
		if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages[0]?.createdAt, collapsed]);

	async function loadMore() {
		if (loadingHistory) return;
		setLoadingHistory(true);
		try {
			await chat.loadMoreMessages();
		} catch {
			error("Could not load older messages");
		} finally {
			setLoadingHistory(false);
		}
	}

	function send() {
		const text = draft.trim();
		if (!text || !user) return;

		socket.send(buildFriendChat(chat.friendId, text));
		chat.messages.unshift({
			senderId: user.id,
			content: text,
			createdAt: new Date().toISOString(),
		});
		setDraft("");
	}

	const ordered = [...messages].reverse();

	return (
		<div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-outline-variant/30 bg-surface-container shadow-2xl overflow-hidden flex flex-col animate-slide-up">
			{/* Header */}
			<div
				className="flex items-center justify-between gap-2 px-4 py-3 bg-surface-container-high cursor-pointer"
				onClick={() => setCollapsed(prev => !prev)}
			>
				<div className="flex items-center gap-2 min-w-0">
					<div className="relative w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
						<span className="font-headline font-bold text-xs text-primary">
							{friend?.username?.[0]?.toUpperCase() ?? "?"}
						</span>
						{friend && <span className={`friend-status-dot ${friend.status}`} />}
					</div>
					<span className="font-headline font-bold text-sm text-on-surface truncate">
						{friend?.username ?? "Loading…"}
					</span>
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<button
						onClick={e => { e.stopPropagation(); setCollapsed(prev => !prev); }}
						className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
						aria-label={collapsed ? "Expand chat" : "Collapse chat"}
					>
						<span className="material-symbols-outlined text-lg">
							{collapsed ? "expand_less" : "expand_more"}
						</span>
					</button>
					<button
						onClick={e => { e.stopPropagation(); onClose(); }}
						className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:text-error hover:bg-surface-container-highest transition-colors"
						aria-label="Close chat"
					>
						<span className="material-symbols-outlined text-lg">close</span>
					</button>
				</div>
			</div>

			{!collapsed && (
				<>
					{/* Messages */}
					<div className="flex flex-col overflow-y-auto h-80 px-4 py-3 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
						{hasMore && ordered.length > 0 && (
							<button
								onClick={loadMore}
								disabled={loadingHistory}
								className="mx-auto mb-2 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
							>
								{loadingHistory ? "Loading…" : "Load earlier"}
							</button>
						)}

						{ordered.length === 0
							? <p className="text-xs text-on-surface-variant italic text-center m-auto">
									{loadingHistory ? "Loading…" : "No messages yet…"}
								</p>
							: ordered.map((m, i) => {
									const isMe = m.senderId === user?.id;
									return (
										<div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
											<span
												className={`max-w-[75%] break-words rounded-xl px-3 py-2 text-xs ${
													isMe
														? "bg-primary/15 text-on-surface border border-primary/30"
														: "bg-surface-container-highest text-on-surface border border-outline-variant/20"
												}`}
											>
												{m.content}
											</span>
										</div>
									);
								})
						}
						<div ref={bottomRef} />
					</div>

					{/* Composer */}
					<div className="flex gap-2 p-3 border-t border-outline-variant/20">
						<input
							className="flex-1 bg-surface-container-highest text-on-surface text-xs rounded px-3 py-2 outline-none border border-outline-variant/20 focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/40"
							placeholder="Message…"
							value={draft}
							maxLength={500}
							onChange={e => setDraft(e.target.value)}
							onKeyDown={e => { if (e.key === "Enter") send(); }}
						/>
						<button
							onClick={send}
							disabled={!draft.trim()}
							className="text-xs px-3 py-2 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
						>
							Send
						</button>
					</div>
				</>
			)}
		</div>
	);
}
