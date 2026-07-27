"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BLACK, PublicUser, RecreatedGame, WHITE } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { friendApi, gamesApi, userApi } from "@/lib/api";
import { getTokens, useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import Avatar from "@/components/ui/Avatar";

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("gameId");
  const { error } = useMsg();
  const { user } = useAuth();
  const [game, setGame] = useState<RecreatedGame | null>(null);
  const [black, setBlack] = useState<PublicUser | null>(null);
  const [white, setWhite] = useState<PublicUser | null>(null);
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    if (!id) router.push("/lobby");

	gamesApi.recreateGame(id!).then(game => {
		setGame(game);

		if (user?.id === game.black_player_id)
			setBlack(user);
		else userApi.getProfile(game.black_player_id).then(setBlack).catch(_ => error("Failed to fetch black player"));

		if (user?.id === game.white_player_id)
			setWhite(user);
		else userApi.getProfile(game.white_player_id).then(setWhite).catch(_ => error("Failed to fetch white player"));
	}).catch(_ => {
		error("Failed to recreate game");
		router.push("/lobby");
	})
  }, []);

  const lastStep = game ? game.steps.length - 1 : 0;
  const goTo = useCallback((next: number) => setStep(Math.min(Math.max(next, 0), lastStep)), [lastStep]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goTo(step - 1);
      else if (event.key === "ArrowRight") goTo(step + 1);
      else if (event.key === "Home") goTo(0);
      else if (event.key === "End") goTo(lastStep);
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, step, lastStep]);

  const scores = useMemo(() => {
    const board = game?.steps[step];
    if (!board) return { black: 0, white: 0 };

	let black = 0;
	let white = 0;

	for (let i = 0; i < board.length; ++i) {
		for (let j = 0; j < board[i].length; ++j) {
			if (board[i][j] === BLACK) ++black;
			else if (board[i][j] === WHITE) ++white;
		}
	}

	return { black, white };
  }, [game, step]);

  const blackUsername = black?.username ?? "Loading...";
  const whiteUsername = white?.username ?? "Loading...";

  // steps[0] is the opening board, so steps[n] is the position right after move n.
  const playedMove = step > 0 ? game?.moves[step - 1] : undefined;
  const moveLabel = !playedMove
    ? "Opening position"
    : `${playedMove.player === BLACK ? "Black" : "White"} → ${"ABCDEFGH"[playedMove.col] ?? "?"}${playedMove.row + 1}`;

  return (
    <>
      <main className="pixel-game max-w-screen-2xl mx-auto w-full px-4 sm:px-6 xl:px-8 py-8 xl:py-12 flex flex-col xl:flex-row gap-8 xl:gap-12 min-h-[calc(100vh-100px)]">

        {/* My panel */}
        <aside className="w-full xl:w-72 xl:flex-shrink-0 flex flex-col gap-6 order-2 xl:order-1">
          <PlayerPanel
            name={blackUsername}
            label={blackUsername}
            pieceColor={BLACK}
            score={scores.black}
            total={64}
            accentClass="border-primary"
            scoreColorClass="text-primary"
            glowColor="#d5a62b"
            isMyTurn={true}
            timeLeft=""
            profileHref={black?.id !== user?.id ? `/friend?id=${black?.id}` : "/profile"}
			addFriendUserId={black?.id !== user?.id ? black?.id : undefined}
            avatarUrl={black?.avatarUrl}
          />
        </aside>

        {/* Board */}
        <section className="flex-1 min-w-0 flex flex-col items-center justify-center gap-8 order-1 xl:order-2">
          {/* Turn banner */}
          <div className={["pixel-turn-banner px-6 py-2 flex items-center gap-3"].filter(Boolean).join(" ")}>
            <span
              className={`pixel-turn-piece white`}
              aria-label={`White pieces moving`}
            />
            <span className="pixel-turn-label font-headline font-bold text-primary tracking-tighter text-sm">
              REVIEWING GAME
            </span>
          </div>

          {/* Grid */}
          <div className="relative w-full max-w-[min(32rem,calc(100vw-2rem))] xl:max-w-[32rem]">
            <div className="absolute -inset-3 sm:-inset-4 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
            <div className="pixel-board-frame relative w-full aspect-square p-2 sm:p-3 md:p-4">
              <div className="pixel-game-board grid grid-cols-8 gap-[2px] p-[2px] w-full h-full">
                {game && game.steps[step] && game.steps[step].map((row, r) =>
                  row.map((cell, c) => {
                    return (
                      <div
                        key={`${r}${c}`}
                        className="pixel-game-square aspect-square min-w-0 min-h-0 flex items-center justify-center"
                      >
                        {cell === BLACK && (
                          <div className="pixel-game-piece dark" />
                        )}
                        {cell === WHITE && (
                          <div className="pixel-game-piece light" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 w-full">
            <div className="review-controls">
              <button type="button" className="review-btn" onClick={() => goTo(0)} disabled={step === 0} title="First move (Home)">
                |◀
              </button>
              <button type="button" className="review-btn" onClick={() => goTo(step - 1)} disabled={step === 0} title="Previous move (←)">
                ◀ Prev
              </button>

              <div className="review-counter">
                <strong>Move {step} / {lastStep}</strong>
                <p>{moveLabel}</p>
                <span className="review-progress">
                  <i style={{ width: `${lastStep ? (step / lastStep) * 100 : 0}%` }} />
                </span>
              </div>

              <button type="button" className="review-btn" onClick={() => goTo(step + 1)} disabled={step === lastStep} title="Next move (→)">
                Next ▶
              </button>
              <button type="button" className="review-btn" onClick={() => goTo(lastStep)} disabled={step === lastStep} title="Last move (End)">
                ▶|
              </button>
            </div>

            <button onClick={() => router.push("/lobby")} className="btn-ghost">
              Back to lobby
            </button>
          </div>
        </section>

        {/* Opponent panel + Chat */}
        <aside className="w-full xl:w-72 xl:flex-shrink-0 flex flex-col gap-6 order-3">
          <PlayerPanel
            name={whiteUsername}
            label={whiteUsername}
            pieceColor={WHITE}
            score={scores.white}
            total={64}
            accentClass="border-tertiary"
            scoreColorClass="text-tertiary"
            glowColor="#3ca6a0"
            isMyTurn={true}
            timeLeft=""
            profileHref={white?.id !== user?.id ? `/friend?id=${white?.id}` : "/profile"}
			addFriendUserId={white?.id !== user?.id ? white?.id : undefined}
            avatarUrl={white?.avatarUrl}
          />
        </aside>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob top-[10%] left-[5%] w-96 h-96 bg-primary/5 blur-[120px]" />
        <div className="ambient-blob bottom-[10%] right-[5%] w-96 h-96 bg-tertiary/5 blur-[120px]" />
      </div>
    </>
  );
}

function PlayerPanel({ name, label, pieceColor, score, total, accentClass, scoreColorClass, glowColor, isMyTurn, profileHref, addFriendUserId, timeLeft, avatarUrl }: {
  name: string; label: string; score: number; total: number;
  pieceColor: typeof BLACK | typeof WHITE;
  accentClass: string; scoreColorClass: string; glowColor: string; isMyTurn: boolean;
  profileHref?: string;
  addFriendUserId?: string;
  timeLeft?: string;
  avatarUrl?: string;
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
    <Avatar avatarUrl={avatarUrl} name={name} className={`pixel-player-avatar w-24 h-24 ${profileHref ? "cursor-pointer" : ""}`} />
  );

  const namePlateStyle = pieceColor === BLACK
    ? { background: "#28231f", color: "var(--pixel-cream)", borderColor: "#28231f" }
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
