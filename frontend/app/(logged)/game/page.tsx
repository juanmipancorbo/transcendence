"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame, type LogEntry } from "@/hooks/useGame";
import { BLACK, WHITE } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const currentTurn = game.state?.currentTurn;
  const currentTurnId = currentTurn === BLACK
    ? game.state?.players.black
    : currentTurn === WHITE ? game.state?.players.white : undefined;
  const currentTurnName = currentTurnId
    ? game.profiles.get(currentTurnId)?.username ?? "Loading..."
    : "Loading...";

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

  const resultTone = game.state?.status !== "FINISHED"
    ? ""
    : !game.state.winner
      ? "result-draw"
      : isSpectator
        ? "result-spectator"
        : game.state.winner === game.myColor ? "result-win" : "result-lose";

  const getLogPlayerName = (entry: LogEntry) => {
    if (entry.byMe) return "You";
    if (entry.type === "abandon") return username1;
    const playerId = entry.player === BLACK
      ? game.state?.players.black
      : game.state?.players.white;
    return playerId ? game.profiles.get(playerId)?.username ?? "Opponent" : "Opponent";
  };

  return (
    <>
      <main className="pixel-game max-w-screen-2xl mx-auto w-full px-4 sm:px-6 xl:px-8 py-8 xl:py-12 flex flex-col xl:flex-row gap-8 xl:gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full xl:w-72 xl:flex-shrink-0 flex flex-col gap-6 order-2 xl:order-1">
          <PlayerPanel
            name={username}
            label={username.toUpperCase()}
            pieceColor={game.myColor === WHITE ? WHITE : BLACK}
            score={score}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#d5a62b"
            isMyTurn={game.yourTurn ?? false}
            timeLeft={game.myColor === BLACK ? game.blackTimeLeftFormat : game.whiteTimeLeftFormat}
            profileHref={isSpectator && leftPlayerId ? `/friend?id=${leftPlayerId}` : "/profile"}
          />
          <div className="match-log">
            <div className="match-log-title">Match_Log</div>
            <div className="overflow-y-auto max-h-64 flex flex-col gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {game.log.length === 0
                ? <p className="text-xs text-on-surface-variant italic">Moves will appear here…</p>
                : game.log.map((entry, i) => <LogLine key={i} entry={entry} playerName={getLogPlayerName(entry)} />)
              }
            </div>
          </div>
        </aside>

        {/* Board */}
        <section className="flex-1 min-w-0 flex flex-col items-center justify-center gap-8 order-1 xl:order-2">
          {/* Turn banner */}
          <div className={["pixel-turn-banner px-6 py-2 flex items-center gap-3", resultTone].filter(Boolean).join(" ")}>
            {game.state?.status === "ACTIVE" && currentTurn && (
              <span
                className={`pixel-turn-piece ${currentTurn === BLACK ? "black" : "white"}`}
                aria-label={`${currentTurn === BLACK ? "Black" : "White"} pieces moving`}
              />
            )}
            <span className="pixel-turn-label font-headline font-bold text-primary tracking-tighter text-sm">
              {game.state?.status === "FINISHED"
                ? gameResultLabel
                : game.state?.status === "WAITING"
                  ? "WAITING FOR PLAYERS…"
                  : game.yourTurn
                    ? "your turn"
                    : currentTurnName.toLowerCase() + " turn"}
            </span>
          </div>

          {/* Grid */}
          <div className="relative w-full max-w-[min(32rem,calc(100vw-2rem))] xl:max-w-[32rem]">
            <div className="absolute -inset-3 sm:-inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="pixel-board-frame relative w-full aspect-square p-2 sm:p-3 md:p-4">
              <div className="pixel-game-board grid grid-cols-8 gap-[2px] p-[2px] w-full h-full">
                {game.state && game.state.board.map((row, r) =>
                  row.map((cell, c) => {
                    const key     = `${r},${c}`;
                    const isValid = game.validSet.has(key) && game.yourTurn && game.state?.status !== "FINISHED";
                    return (
                      <div
                        key={key}
                        onClick={() => { if (isValid) game.makeMove(r, c); }}
                        className={`pixel-game-square aspect-square min-w-0 min-h-0 flex items-center justify-center ${isValid ? "valid cursor-pointer" : ""}`}
                      >
                        {cell === BLACK && (
                          <div className="pixel-game-piece dark" />
                        )}
                        {cell === WHITE && (
                          <div className="pixel-game-piece light" />
                        )}
                        {cell !== BLACK && cell !== WHITE && isValid && (
                          <div className="pixel-valid-move" />
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
            pieceColor={game.myColor === WHITE ? BLACK : WHITE}
            score={score1}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#3ca6a0"
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
            disabled={game.state?.status === "FINISHED"}
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

function PlayerPanel({ name, label, pieceColor, score, total, accentClass, scoreColorClass, glowColor, isMyTurn, profileHref, addFriendUserId, timeLeft }: {
  name: string; label: string; score: number; total: number;
  pieceColor: typeof BLACK | typeof WHITE;
  accentClass: string; scoreColorClass: string; glowColor: string; isMyTurn: boolean;
  profileHref?: string;
  addFriendUserId?: string;
  timeLeft?: string;
}) {
  const { message, error } = useMsg();
  const [friendRelation, setFriendRelation] = useState<"loading" | "none" | "incoming" | "sent" | "friends" | "sending">("loading");

  const refreshFriendRelation = useCallback(async () => {
    if (!addFriendUserId) return;
    const token = getTokens()?.accessToken;
    if (!token) return;

    const [isFriend, incoming, outgoing] = await Promise.all([
      friendApi.isFriend(token, addFriendUserId),
      friendApi.getIncomingRequests(token),
      friendApi.getOutgoingRequests(token),
    ]);

    if (isFriend)
      setFriendRelation("friends");
    else if (incoming.some(user => user.id === addFriendUserId))
      setFriendRelation("incoming");
    else if (outgoing.some(user => user.id === addFriendUserId))
      setFriendRelation("sent");
    else
      setFriendRelation("none");
  }, [addFriendUserId]);

  useEffect(() => {
    if (!addFriendUserId) return;

    refreshFriendRelation().catch(() => setFriendRelation("none"));
    const interval = window.setInterval(() => refreshFriendRelation().catch(() => {}), 10000);
    window.addEventListener("focus", refreshFriendRelation);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshFriendRelation);
    };
  }, [addFriendUserId, refreshFriendRelation]);

  async function sendFriendRequest() {
    if (!addFriendUserId || !["none", "incoming"].includes(friendRelation)) return;
    const token = getTokens()?.accessToken;
    if (!token) return;

    const wasIncoming = friendRelation === "incoming";
    setFriendRelation("sending");
    try {
      await friendApi.sendRequest(token, addFriendUserId);
      setFriendRelation(wasIncoming ? "friends" : "sent");
      message(wasIncoming ? "Friend request accepted" : "Friend request sent");
    } catch (err) {
      await refreshFriendRelation().catch(() => setFriendRelation("none"));
      error(err instanceof Error ? err.message : "Could not update friend request");
    }
  }

  const avatar = (
    <div
      className={`pixel-player-avatar w-24 h-24 flex items-center justify-center ${profileHref ? "cursor-pointer" : ""}`}
      style={{ borderColor: glowColor }}
    >
      <span className={`font-headline font-black text-3xl ${scoreColorClass}`}>
        {name[0].toUpperCase()}
      </span>
    </div>
  );

  const namePlateStyle = pieceColor === BLACK
    ? { background: "#28231f", color: "var(--pixel-cream)", borderColor: "var(--pixel-cream)" }
    : { background: "var(--pixel-cream)", color: "#28231f", borderColor: "#28231f" };

  return (
    <div className={`pixel-player-panel player-panel ${accentClass}`}>
      <div className="relative">
        {profileHref ? <Link href={profileHref} aria-label={`View ${name}'s profile`}>{avatar}</Link> : avatar}
        {profileHref ? (
          <Link
            href={profileHref}
            className="pixel-player-name absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 font-headline whitespace-nowrap"
            style={namePlateStyle}
          >
            {label}
          </Link>
        ) : (
          <div
            className="pixel-player-name absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 font-headline whitespace-nowrap"
            style={namePlateStyle}
          >
            {label}
          </div>
        )}
      </div>

      {addFriendUserId && !["loading", "friends"].includes(friendRelation) && (
        <button
          type="button"
          onClick={sendFriendRequest}
          disabled={["sending", "sent"].includes(friendRelation)}
          className="mt-5 rounded border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60"
          style={{ color: glowColor, borderColor: `${glowColor}50`, background: `${glowColor}10` }}
        >
          {friendRelation === "sending"
            ? "Updating..."
            : friendRelation === "sent"
              ? "Request sent"
              : friendRelation === "incoming"
                ? "Accept request"
                : "Add friend"}
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

function ChatPanel({ messages, profiles, myId, onSend, readOnly = false, disabled = false }: {
  messages: Array<{ sender: string; message: string }>;
  profiles: Map<string, { username?: string }>;
  myId: string;
  onSend: (msg: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    if (disabled) return;
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
          placeholder={disabled ? "Match finished" : "Message…"}
          value={draft}
          disabled={disabled}
          maxLength={200}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
        />
        <button
          onClick={submit}
          disabled={disabled || !draft.trim()}
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

function LogLine({ entry, playerName }: { entry: LogEntry; playerName: string }) {
  if (entry.type === 'abandon') {
    return (
      <p className="text-xs text-on-surface-variant">
        <span className={entry.byMe ? "text-primary" : "text-tertiary"}>
          {playerName}
        </span>
        {" resigned"}
      </p>
    );
  }
  return (
    <p className="text-xs text-on-surface-variant font-mono">
      <span className="text-on-surface-variant/40">{entry.turn}. </span>
      <span className={entry.byMe ? "text-primary" : "text-tertiary"}>
        {playerName}
      </span>
      {` ${entry.col}${entry.row}`}
      <span className="text-on-surface-variant/50"> +{entry.flips}</span>
    </p>
  );
}
