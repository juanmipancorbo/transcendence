"use client";

import { useEffect, useRef, useState } from "react";
import { Chat, useWs } from "@/hooks/useWs";
import { useMsg } from "@/hooks/useMsg";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import { buildFriendChat } from "@/lib/ws/stream-utils";
import { PublicUser } from "@/types";
import Avatar from "@/components/ui/Avatar";

interface ChatWindowProps {
	chat: Chat;
	friendProfile?: PublicUser;
	onClose: () => void;
}

export default function ChatWindow({ chat, friendProfile, onClose }: ChatWindowProps) {
	const { socket } = useWs();
	const { error } = useMsg();
	const { user } = useAuth();

	const [friend, setFriend] = useState<PublicUser | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	const [hasUnread, setHasUnread] = useState(false);
	const [draft, setDraft] = useState("");
	const [loadingHistory, setLoadingHistory] = useState(false);

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const lastMessageAt = useRef<string | undefined>(undefined);

	const messages = chat.messages;
	const hasMore = !chat.isFinal;

	// The Chat itself carries no profile info, so the header still needs its own
	// fetch for the friend's username/avatar/status.
	useEffect(() => {
		if (friendProfile) {
			setFriend(friendProfile);
			return;
		}
		let cancelled = false;
		userApi.getProfile(chat.friendId).then(p => { if (!cancelled) setFriend(p); }).catch(() => {});
		return () => { cancelled = true; };
	}, [chat.friendId, friendProfile]);

	useEffect(() => {
		if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages[0]?.createdAt, collapsed]);

	useEffect(() => {
		if (!collapsed) inputRef.current?.focus();
	}, [collapsed, chat.friendId]);

	useEffect(() => {
		const latest = messages[0];
		if (!latest) return;

		if (lastMessageAt.current && lastMessageAt.current !== latest.createdAt && collapsed && latest.senderId !== user?.id)
			setHasUnread(true);
		lastMessageAt.current = latest.createdAt;
	}, [messages[0]?.createdAt, collapsed, user?.id]);

	function toggleCollapsed() {
		setCollapsed(current => {
			if (current) setHasUnread(false);
			return !current;
		});
	}

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
		if (!text || !user || friend?.status === "busy") return;

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
		<div className={`pixel-chat fixed bottom-6 right-6 z-50 w-80 border bg-surface-container shadow-2xl overflow-hidden flex flex-col animate-slide-up ${hasUnread ? "border-primary" : "border-outline-variant/30"}`}>
			{/* Header */}
			<div
				className={`flex items-center justify-between gap-2 px-4 py-3 cursor-pointer ${hasUnread ? "bg-primary/15 animate-pulse" : "bg-surface-container-high"}`}
				onClick={toggleCollapsed}
			>
				<div className="flex items-center gap-2 min-w-0">
					<Avatar avatarUrl={friend?.avatarUrl} name={friend?.username ?? "Friend"} className="relative w-8 h-8 bg-surface-container-highest shrink-0">
						{friend && <span className={`friend-status-dot ${friend.status}`} />}
					</Avatar>
					<div className="min-w-0">
						<span className="block font-headline font-bold text-sm truncate">
							{friend?.username ?? "Loading…"}
						</span>
						{friend && <span className="pixel-chat-presence">{friend.status === "busy" ? "In game" : friend.status}</span>}
					</div>
					{hasUnread && <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-primary">New</span>}
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<button
						onClick={e => { e.stopPropagation(); toggleCollapsed(); }}
						className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
						aria-label={collapsed ? "Expand chat" : "Collapse chat"}
					>
						<span className="text-lg font-bold leading-none" aria-hidden="true">
							{collapsed ? "+" : "-"}
						</span>
					</button>
					<button
						onClick={e => { e.stopPropagation(); onClose(); }}
						className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:text-error hover:bg-surface-container-highest transition-colors"
						aria-label="Close chat"
					>
						<span className="text-lg font-bold leading-none" aria-hidden="true">x</span>
					</button>
				</div>
			</div>

			{!collapsed && (
				<>
					{/* Messages */}
					<div className="pixel-chat-messages flex flex-col overflow-y-auto h-80 px-4 py-3 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
												className={`pixel-chat-message max-w-[75%] break-words px-3 py-2 text-xs ${isMe ? "mine" : "theirs"}`}
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
					<div className="pixel-chat-composer flex gap-2 p-3 border-t">
						<input
							ref={inputRef}
							className="flex-1 bg-surface-container-highest text-on-surface text-xs rounded px-3 py-2 outline-none border border-outline-variant/20 focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/40"
							placeholder={friend?.status === "busy" ? "Player is in a game" : "Message…"}
							disabled={friend?.status === "busy"}
							value={draft}
							maxLength={500}
							onChange={e => setDraft(e.target.value)}
							onKeyDown={e => { if (e.key === "Enter") send(); }}
						/>
						<button
							onClick={send}
							disabled={!draft.trim() || friend?.status === "busy"}
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
