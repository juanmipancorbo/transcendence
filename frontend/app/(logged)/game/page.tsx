"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame, type LogEntry } from "@/hooks/useGame";
import { BLACK, WHITE } from "@/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { friendApi } from "@/lib/api";
import { getTokens } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const game = useGame(id ?? "");

  useEffect(() => {
    if (!id) router.push("/lobby");
  }, []);

  const isSpectator = game.state !== null && game.myColor === 0;

  let username;
  let username1;
  let score;
  let score1;
  let leftPlayerId: string | undefined;
  let rightPlayerId: string | undefined;
  if (game.myColor === WHITE) {
    username   = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
    username1  = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
    score      = game.state?.scores.white ?? 0;
    score1     = game.state?.scores.black ?? 0;
    leftPlayerId = game.state?.players.white;
    rightPlayerId = game.state?.players.black;
  } else {
    // BLACK player or spectator — left = black, right = white
    username   = game.profiles.get(game.state?.players.black ?? "")?.username ?? "Loading...";
    username1  = game.profiles.get(game.state?.players.white ?? "")?.username ?? "Loading...";
    score      = game.state?.scores.black ?? 0;
    score1     = game.state?.scores.white ?? 0;
    leftPlayerId = game.state?.players.black;
    rightPlayerId = game.state?.players.white;
  }

  const gameResultLabel = (() => {
    if (game.state?.status !== "FINISHED") return null;
    const winner = game.state.winner;
    if (!winner) return "DRAW";
    if (isSpectator) {
      const winnerId = winner === BLACK ? game.state.players.black : game.state.players.white;
      const winnerName = game.profiles.get(winnerId)?.username ?? "Player";
      return winnerName.toUpperCase() + "_WINS";
    }
    return winner === game.myColor ? "YOU_WIN" : "YOU_LOSE";
  })();

  return (
    <>
      <main className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 xl:px-8 py-8 xl:py-12 flex flex-col xl:flex-row gap-8 xl:gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full xl:w-72 xl:flex-shrink-0 flex flex-col gap-6 order-2 xl:order-1">
          <PlayerPanel
            name={username}
            label={username.toUpperCase()}
            score={score}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#8ff5ff"
            isMyTurn={game.yourTurn ?? false}
            timeLeft={game.myColor === BLACK ? game.blackTimeLeftFormat : game.whiteTimeLeftFormat}
            profileHref={isSpectator && leftPlayerId ? `/friend?id=${leftPlayerId}` : "/profile"}
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
        <section className="flex-1 min-w-0 flex flex-col items-center justify-center gap-8 order-1 xl:order-2">
          {/* Turn banner */}
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-headline font-bold text-primary tracking-tighter text-sm">
              {game.state?.status === "FINISHED"
                ? gameResultLabel
                : game.state?.status === "WAITING"
                  ? "WAITING FOR PLAYERS…"
                  : isSpectator
                    ? `${(game.state?.currentTurn === BLACK ? username : username1).toUpperCase()}_MOVING…`
                    : game.yourTurn ? "YOUR_TURN" : `${username1.toUpperCase()}_MOVING…`}
            </span>
          </div>

          {/* Grid */}
          <div className="relative w-full max-w-[min(32rem,calc(100vw-2rem))] xl:max-w-[32rem]">
            <div className="absolute -inset-3 sm:-inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative w-full aspect-square bg-surface-container-high p-2 sm:p-3 md:p-4 rounded-xl shadow-2xl">
              <div className="grid grid-cols-8 gap-[2px] bg-surface-container-highest p-[2px] w-full h-full">
                {game.state && game.state.board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = game.validSet.has(key) && game.yourTurn && game.state?.status !== "FINISHED";
                    return (
                      <div
                        key={key}
                        onClick={() => { if (isValid) game.makeMove(r, c); }}
                        className={`aspect-square min-w-0 min-h-0 bg-surface-container-low flex items-center justify-center transition-all ${isValid ? "cursor-pointer hover:bg-surface-container-high" : ""}`}
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
            {isSpectator ? (
              <button onClick={() => router.push("/lobby")} className="btn-ghost">
                Leave Game
              </button>
            ) : (
              <button onClick={() => {
                if (game.state?.status !== "FINISHED")
                  game.abandon();
                router.push("/lobby");
              }} className="btn-ghost danger">
                <span className="font-bold" aria-hidden="true">x</span>
                {game.state?.status === "FINISHED" ? "Back to Lobby" : "Resign"}
              </button>
            )}
          </div>
        </section>

        {/* Opponent panel + Chat */}
        <aside className="w-full xl:w-72 xl:flex-shrink-0 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={username1}
            label={username1.toUpperCase()}
            score={score1}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#d575ff"
            isMyTurn={game.yourTurn === false}
            timeLeft={game.myColor === BLACK ? game.whiteTimeLeftFormat : game.blackTimeLeftFormat}
            profileHref={rightPlayerId ? `/friend?id=${rightPlayerId}` : undefined}
            addFriendUserId={isSpectator ? undefined : rightPlayerId}
          />
          <ChatPanel
            messages={game.messages}
            profiles={game.profiles}
            myId={game.state?.players[game.myColor === WHITE ? "white" : "black"] ?? ""}
            onSend={game.chat}
            readOnly={isSpectator}
          />
          <SpectatorList spectators={game.spectators} profiles={game.profiles} />
        </aside>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob top-[10%] left-[5%] w-96 h-96 bg-primary/5 blur-[120px]" />
        <div className="ambient-blob bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 blur-[120px]" />
      </div>
    </>
  );
}

function PlayerPanel({ name, label, score, total, accentClass, scoreColorClass, glowColor, isMyTurn, profileHref, addFriendUserId, timeLeft }: {
  name: string; label: string; score: number; total: number;
  accentClass: string; scoreColorClass: string; glowColor: string; isMyTurn: boolean;
  profileHref?: string;
  addFriendUserId?: string;
  timeLeft?: string;
}) {
  const { message, error } = useMsg();
  const [addState, setAddState] = useState<"idle" | "sending" | "sent">("idle");

  async function sendFriendRequest() {
    if (!addFriendUserId || addState !== "idle") return;
    const token = getTokens()?.accessToken;
    if (!token) return;

    setAddState("sending");
    try {
      await friendApi.sendRequest(token, addFriendUserId);
      setAddState("sent");
      message("Friend request sent");
    } catch (err) {
      setAddState("idle");
      error(err instanceof Error ? err.message : "Could not send friend request");
    }
  }

  const avatar = (
    <div
      className={`w-24 h-24 rounded-full border-2 p-1 flex items-center justify-center bg-surface-container-highest ${profileHref ? "cursor-pointer hover:brightness-125" : ""}`}
      style={{ borderColor: glowColor }}
    >
      <span className={`font-headline font-black text-3xl ${scoreColorClass}`}>
        {name[0].toUpperCase()}
      </span>
    </div>
  );

  return (
    <div className={`player-panel ${accentClass}`}>
      <div className="relative">
        {profileHref ? <Link href={profileHref} aria-label={`View ${name}'s profile`}>{avatar}</Link> : avatar}
        {profileHref ? (
          <Link
            href={profileHref}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap text-on-primary-fixed hover:brightness-110"
            style={{ background: glowColor }}
          >
            {label}
          </Link>
        ) : (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full font-headline tracking-widest whitespace-nowrap text-on-primary-fixed"
            style={{ background: glowColor }}
          >
            {label}
          </div>
        )}
      </div>

      {addFriendUserId && (
        <button
          type="button"
          onClick={sendFriendRequest}
          disabled={addState !== "idle"}
          className="mt-5 rounded border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
          style={{ color: glowColor, borderColor: `${glowColor}50`, background: `${glowColor}10` }}
        >
          {addState === "sending" ? "Sending..." : addState === "sent" ? "Request sent" : "Add friend"}
        </button>
      )}

      <div className="text-center mt-2">
        <div className={`player-score-value ${scoreColorClass}`}>{score}</div>
        <div className="player-score-label">Captured_Cells</div>
        {timeLeft && (
          <div className="text-xs font-mono mt-1" style={{ color: glowColor }}>
            {timeLeft}
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
        <span className="player-active-badge" style={{ background: `${glowColor}20`, color: glowColor }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: glowColor }} />
          ACTIVE
        </span>
      )}
    </div>
  );
}

function ChatPanel({ messages, profiles, myId, onSend, readOnly = false }: {
  messages: Array<{ sender: string; message: string }>;
  profiles: Map<string, { username?: string }>;
  myId: string;
  onSend: (msg: string) => void;
  readOnly?: boolean;
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

      {readOnly
        ? <p className="text-[10px] text-on-surface-variant/40 italic mt-1">Spectators cannot send messages</p>
        : <div className="flex gap-2 mt-1">
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
      </div>}
    </div>
  );
}

function SpectatorList({ spectators, profiles }: {
  spectators: string[];
  profiles: Map<string, { username?: string }>;
}) {
  if (spectators.length === 0) return null;
  return (
    <div className="match-log flex flex-col gap-2">
      <div className="match-log-title">Spectators ({spectators.length})</div>
      <div className="flex flex-col gap-1">
        {spectators.map(id => (
          <p key={id} className="text-xs text-on-surface-variant">
            {profiles.get(id)?.username ?? "…"}
          </p>
        ))}
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
