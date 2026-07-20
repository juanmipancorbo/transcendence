"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMsg } from "@/hooks/useMsg";
import { gamesApi, userApi } from "@/lib/api";
import { BLACK, CompletedGameData, PlayerColor, PublicUser, WHITE } from "@/types";
import PixelLoader from "@/components/ui/PixelLoader";

export default function CompletedGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  const { user } = useAuth();
  const { error } = useMsg();
  const [result, setResult] = useState<CompletedGameData | null>(null);
  const [profiles, setProfiles] = useState(new Map<string, PublicUser>());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!gameId) {
      router.push("/lobby");
      return;
    }

    let cancelled = false;
    gamesApi.getResult(gameId)
      .then(async completed => {
        const players = await Promise.all([
          userApi.getProfile(completed.blackId),
          userApi.getProfile(completed.whiteId),
        ]);
        if (cancelled) return;
        setResult(completed);
        setProfiles(new Map(players.map(profile => [profile.id, profile])));
      })
      .catch(err => {
        if (cancelled) return;
        setFailed(true);
        error(err instanceof Error ? err.message : "Could not load match result");
      });

    return () => { cancelled = true; };
  }, [gameId, router, error]);

  const players = useMemo(() => {
    if (!result || !user) return null;
    const myColor: PlayerColor = result.blackId === user.id ? BLACK : WHITE;
    const opponentColor: PlayerColor = myColor === BLACK ? WHITE : BLACK;
    const idFor = (color: typeof BLACK | typeof WHITE) => color === BLACK ? result.blackId : result.whiteId;
    const scoreFor = (color: typeof BLACK | typeof WHITE) => color === BLACK ? result.scores.black : result.scores.white;
    return {
      mine: { id: idFor(myColor), color: myColor, score: scoreFor(myColor) },
      opponent: { id: idFor(opponentColor), color: opponentColor, score: scoreFor(opponentColor) },
      myColor,
    };
  }, [result, user]);

  if (failed) {
    return (
      <main className="pixel-game min-h-[calc(100vh-100px)] flex flex-col items-center justify-center gap-6 p-8">
        <div className="pixel-turn-banner result-lose px-6 py-3">
          <span className="pixel-turn-label font-headline font-bold">RESULT_UNAVAILABLE</span>
        </div>
        <button onClick={() => router.push("/lobby")} className="btn-ghost">Back to Lobby</button>
      </main>
    );
  }

  if (!result || !players) {
    return <main className="min-h-[calc(100vh-100px)] flex items-center justify-center"><PixelLoader label="Loading result" /></main>;
  }

  const resultLabel = result.winner === 0
    ? "DRAW"
    : result.winner === players.myColor ? "YOU_WIN" : "YOU_LOSE";
  const resultTone = result.winner === 0
    ? "result-draw"
    : result.winner === players.myColor ? "result-win" : "result-lose";

  return (
    <main className="pixel-game max-w-screen-2xl mx-auto w-full px-4 sm:px-6 xl:px-8 py-8 xl:py-12 min-h-[calc(100vh-100px)]">
      <div className="flex flex-col items-center gap-8">
        <div className={["pixel-turn-banner px-8 py-3 flex items-center gap-3", resultTone].join(" ")}>
          <span className="pixel-turn-label font-headline font-bold text-sm">{resultLabel}</span>
        </div>

        <div className="w-full grid grid-cols-1 xl:grid-cols-[18rem_minmax(0,32rem)_18rem] items-center justify-center gap-8 xl:gap-12">
          <ResultPlayer player={players.mine} profile={profiles.get(players.mine.id)} isMe />

          <section className="flex flex-col items-center gap-5 min-w-0">
            <div className="match-log-title">FINAL_BOARD</div>
            <div className="relative w-full max-w-[min(32rem,calc(100vw-2rem))]">
              <div className="pixel-board-frame relative w-full aspect-square p-2 sm:p-3 md:p-4">
                <div className="pixel-game-board grid grid-cols-8 gap-[2px] p-[2px] w-full h-full">
                  {result.board.map((row, rowIndex) => row.map((cell, colIndex) => (
                    <div key={`${rowIndex},${colIndex}`} className="pixel-game-square aspect-square min-w-0 min-h-0 flex items-center justify-center">
                      {cell === BLACK && <div className="pixel-game-piece dark" />}
                      {cell === WHITE && <div className="pixel-game-piece light" />}
                    </div>
                  )))}
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/lobby")} className="btn-ghost">Back to Lobby</button>
          </section>

          <ResultPlayer player={players.opponent} profile={profiles.get(players.opponent.id)} />
        </div>
      </div>
    </main>
  );
}

function ResultPlayer({ player, profile, isMe = false }: {
  player: { id: string; color: typeof BLACK | typeof WHITE; score: number };
  profile?: PublicUser;
  isMe?: boolean;
}) {
  const name = profile?.username ?? "Loading...";
  const isBlack = player.color === BLACK;
  const plateStyle = isBlack
    ? { background: "#28231f", color: "var(--pixel-cream)", borderColor: "#28231f" }
    : { background: "var(--pixel-cream)", color: "#28231f", borderColor: "#28231f" };
  const profileHref = isMe ? "/profile" : "/friend?id=" + player.id;

  return (
    <aside className="pixel-player-panel player-panel flex flex-col items-center gap-5 p-6">
      <div className="relative">
        <Link href={profileHref} aria-label={`View ${name} profile`}>
          <div className="pixel-player-avatar w-24 h-24 flex items-center justify-center cursor-pointer">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-headline font-black text-3xl">{name[0]?.toUpperCase() ?? "?"}</span>
            )}
          </div>
        </Link>
        <Link
          href={profileHref}
          className="pixel-player-name absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 font-headline whitespace-nowrap"
          style={plateStyle}
        >
          {name}
        </Link>
      </div>
      <div className="text-center mt-2">
        <div className="player-score-value">{player.score}</div>
        <div className="player-score-label">Captured_Cells</div>
      </div>
      <div className="player-bar-track w-full">
        <div
          className="h-full"
          style={{ width: `${(player.score / 64) * 100}%`, background: isBlack ? "#28231f" : "var(--pixel-cream)" }}
        />
      </div>
    </aside>
  );
}
