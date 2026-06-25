"use client";

import { useRouter, useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { useGame, type LogEntry } from "@/hooks/useGame";
import { BLACK, WHITE } from "@/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { friendApi } from "@/lib/api";
import { getTokens } from "@/hooks/useAuth";
// TODO: Maybe visualize current spectators? listed in game.spectators, their profiles also in game.profiles


export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [joinError, setJoinError] = useState<string | null>(null);
  const onJoin = useCallback((e?: Error) => { if (e) setJoinError(e.message); }, []);
  const game = useGame(id ?? "", onJoin);

  useEffect(() => {
    if (!id) router.push("/lobby");
  }, []);

  let username;
  let username1;
  let score;
  let score1;
  let opponentId: string | undefined;
  if (game.myColor === WHITE) {
    username   = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
    username1  = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
    score      = game.state?.scores.white ?? 0;
    score1     = game.state?.scores.black ?? 0;
    opponentId = game.state?.players.black;
  } else {
    username   = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
    username1  = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
    score      = game.state?.scores.black ?? 0;
    score1     = game.state?.scores.white ?? 0;
    opponentId = game.state?.players.white;
  }


  if (joinError) return (
    <ProtectedLayout activeRoute="/game">
      <main className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[calc(100vh-100px)]">
        <p className="text-on-surface-variant text-sm">Could not connect to game</p>
        <p className="text-xs font-mono" style={{ color: "rgba(239,68,68,0.7)" }}>{joinError}</p>
        <button onClick={() => router.push("/lobby")} className="btn-ghost">
          Back to Lobby
        </button>
      </main>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout activeRoute="/game">
      <main className="max-w-screen-2xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-2 md:order-1">
          <PlayerPanel
            name={username}
            label={username.toUpperCase()}
            score={score}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#8ff5ff"
            isMyTurn={game.yourTurn}
            timeLeft={game.timeLeftFormat}
          />
          <div className="match-log">
            <div className="match-log-title">Match_Log</div>
            <div className="overflow-y-auto max-h-64 flex flex-col gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {game.log.length === 0
                ? <p className="text-xs text-on-surface-variant italic">Moves will appear here…</p>
                : game.log.map((entry, i) => <LogLine key={i} entry={entry} />)
              }
            </div>
          </div>
        </aside>

        {/* Board */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 order-1 md:order-2">
          {/* Turn banner */}
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-headline font-bold text-primary tracking-tighter text-sm">
              {game.state?.status === "FINISHED" ? "GAME OVER" : game.yourTurn ? "YOUR_TURN" : `${username1.toUpperCase()}_MOVING…`}
            </span>
          </div>

          {/* Grid */}
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative bg-surface-container-high p-4 rounded-xl shadow-2xl">
              <div className="grid grid-cols-8 gap-[2px] bg-surface-container-highest p-[2px]">
                {game.state && game.state.board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = game.validSet.has(key) && game.yourTurn && game.state?.status !== "FINISHED";
                    return (
                      <div
                        key={key}
                        onClick={() => { if (isValid) game.makeMove(r, c); }}
                        className={`w-12 h-12 md:w-14 md:h-14 bg-surface-container-low flex items-center justify-center transition-all ${isValid ? "cursor-pointer hover:bg-surface-container-high" : ""}`}
                      >
                        {cell === BLACK && (
                          <div className="w-3/4 h-3/4 rounded-full bg-on-surface shadow-[0_0_10px_rgba(255,255,255,0.15)]" />
                        )}
                        {cell === WHITE && (
                          <div className="w-3/4 h-3/4 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,238,252,0.4)]" />
                        )}
                        {cell !== BLACK && cell !== WHITE && isValid && (
                          <div className="w-1/3 h-1/3 rounded-full bg-primary/30 border border-primary/40" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => {
				if (game.state?.status !== "FINISHED")
					game.abandon();
				router.push("/lobby");
			}} className="btn-ghost danger">
              <span className="material-symbols-outlined text-sm">close</span>
              {game.state?.status === "FINISHED" ? "Back to Lobby" : "Resign"}
            </button>
          </div>
        </section>

        {/* Opponent panel + Chat */}
        <aside className="w-full md:w-72 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={username1}
            label={username1.toUpperCase()}
            score={score1}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#d575ff"
            isMyTurn={game.opponentTurn}
            timeLeft={game.opponentTimeLeftFormat}
            userId={opponentId}
          />
          <ChatPanel
            messages={game.messages}
            profiles={game.profiles}
            myId={game.state?.players[game.myColor === WHITE ? "white" : "black"] ?? ""}
            onSend={game.chat}
          />
        </aside>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob top-[10%] left-[5%] w-96 h-96 bg-primary/5 blur-[120px]" />
        <div className="ambient-blob bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 blur-[120px]" />
      </div>
    </ProtectedLayout>
  );
}

function PlayerPanel({ name, label, score, total, accentClass, scoreColorClass, glowColor, isMyTurn, userId, timeLeft }: {
  name: string; label: string; score: number; total: number;
  accentClass: string; scoreColorClass: string; glowColor: string; isMyTurn: boolean;
  userId?: string;
  timeLeft?: string;
}) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [addState,   setAddState]   = useState<"idle" | "sent">("idle");
  const [tipVisible, setTipVisible] = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  async function sendFriendRequest() {
    if (!userId || addState === "sent") return;
    const token = getTokens()?.accessToken;
    if (!token) return;
    await friendApi.sendRequest(token, userId).catch(() => {});
    setAddState("sent");
    setMenuOpen(false);
  }

  function onAddBtnEnter() {
    tipTimer.current = setTimeout(() => setTipVisible(true), 700);
  }
  function onAddBtnLeave() {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    setTipVisible(false);
  }

  return (
    <div className={`player-panel ${accentClass}`}>
      <div className="relative" ref={menuRef}>

        {/* Avatar — clickable*/}
        <div
          className={`w-24 h-24 rounded-full border-2 p-1 flex items-center justify-center bg-surface-container-highest ${userId ? "cursor-pointer" : ""}`}
          style={{ borderColor: glowColor }}
          onClick={() => userId && setMenuOpen(prev => !prev)}
        >
          <span className={`font-headline font-black text-3xl ${scoreColorClass}`}>
            {name[0].toUpperCase()}
          </span>
        </div>

        {/* Quick Add Friend button */}
        {userId && (
          <div className="absolute -top-1 -right-1">
            <button
              onClick={e => { e.stopPropagation(); sendFriendRequest(); }}
              onMouseEnter={onAddBtnEnter}
              onMouseLeave={onAddBtnLeave}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                background: addState === "sent" ? "#22c55e20" : `${glowColor}20`,
                color:      addState === "sent" ? "#22c55e"   : glowColor,
                border:     `1px solid ${addState === "sent" ? "#22c55e50" : `${glowColor}50`}`,
              }}
            >
              {addState === "sent" ? "✓" : "+"}
            </button>
            {tipVisible && (
              <div
                className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded text-[10px] whitespace-nowrap font-semibold pointer-events-none"
                style={{ background: "var(--surface-container-highest)", color: "var(--on-surface-variant)", border: "1px solid rgba(72,71,77,0.4)" }}
              >
                {addState === "sent" ? "Request sent" : "Send friend request"}
              </div>
            )}
          </div>
        )}

        {/* Name label */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap text-on-primary-fixed"
          style={{ background: glowColor }}
        >
          {label}
        </div>

        {/* Dropdown */}
        {userId && menuOpen && (
          <div
            className="absolute top-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 w-40 rounded-lg overflow-hidden z-10"
            style={{ background: "var(--surface-container-high)", border: "1px solid rgba(72,71,77,0.3)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
          >
            <button
              onClick={() => { setMenuOpen(false); window.open(`/friend?id=${userId}`, "_blank"); }}
              className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-surface-container-highest transition-colors"
              style={{ color: "var(--on-surface)" }}
            >
              View Profile ↗
            </button>
            <button
              onClick={sendFriendRequest}
              disabled={addState === "sent"}
              className="w-full px-4 py-3 text-left text-xs font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              style={{ color: addState === "sent" ? "#22c55e" : glowColor }}
            >
              {addState === "sent" ? "✓ Request Sent" : "Add Friend"}
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-2">
        <div className={`player-score-value ${scoreColorClass}`}>{score}</div>
        <div className="player-score-label">Captured_Cells</div>
        {timeLeft && (
          <div className="text-xs font-mono mt-1" style={{ color: glowColor }}>
            ⏱ {timeLeft}
          </div>
        )}
      </div>

      <div className="player-bar-track">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(score / total) * 100}%`, background: glowColor, boxShadow: `0 0 10px ${glowColor}` }}
        />
      </div>

      {isMyTurn && (
        <span
          className="player-active-badge"
          style={{ background: `${glowColor}20`, color: glowColor }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: glowColor }} />
          ACTIVE
        </span>
      )}
    </div>
  );
}

function ChatPanel({ messages, profiles, myId, onSend }: {
  messages: Array<{ sender: string; message: string }>;
  profiles: Map<string, { username?: string }>;
  myId: string;
  onSend: (msg: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    const now = Date.now();
    if (now - lastSentAt.current < 500) return; // 500 ms cooldown
    lastSentAt.current = now;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="match-log flex flex-col gap-2">
      <div className="match-log-title">Chat</div>

      <div className="overflow-y-auto max-h-48 flex flex-col gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.length === 0
          ? <p className="text-xs text-on-surface-variant italic">No messages yet…</p>
          : messages.map((m, i) => {
              const isMe = m.sender === myId;
              const name = profiles.get(m.sender)?.username ?? "…";
              return (
                <p key={i} className="text-xs text-on-surface-variant">
                  <span className={isMe ? "text-primary font-semibold" : "text-tertiary font-semibold"}>
                    {isMe ? "You" : name}
                  </span>
                  {": "}
                  {m.message}
                </p>
              );
            })
        }
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-1">
        <input
          className="flex-1 bg-surface-container-highest text-on-surface text-xs rounded px-2 py-1 outline-none border border-outline/20 focus:border-primary/50 transition-colors placeholder:text-on-surface-variant/40"
          placeholder="Message…"
          value={draft}
          maxLength={200}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="text-xs px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  if (entry.type === 'abandon') {
    return (
      <p className="text-xs text-on-surface-variant">
        <span className={entry.byMe ? "text-primary" : "text-tertiary"}>
          {entry.byMe ? "You" : "Opponent"}
        </span>
        {" resigned"}
      </p>
    );
  }
  return (
    <p className="text-xs text-on-surface-variant font-mono">
      <span className="text-on-surface-variant/40">{entry.turn}. </span>
      <span className={entry.byMe ? "text-primary" : "text-tertiary"}>
        {entry.byMe ? "You" : "Opp"}
      </span>
      {` ${entry.col}${entry.row}`}
      <span className="text-on-surface-variant/50"> +{entry.flips}</span>
    </p>
  );
}
