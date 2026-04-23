"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { userApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

export default function ProfilePage() {
  return (
    <ProtectedLayout activeRoute="/profile">
      <Suspense fallback={<Loading />}>
        <ProfileContent />
      </Suspense>
    </ProtectedLayout>
  );
}

// Fake match history for display (replace with real API data when available)
const MOCK_HISTORY = [
  { result: "WIN",  opponent: "NeonRazor",  score: "42–22", duration: "18m", border: "border-primary" },
  { result: "LOSS", opponent: "V_Specter",   score: "18–46", duration: "24m", border: "border-error" },
  { result: "WIN",  opponent: "CyberDruid",  score: "38–26", duration: "21m", border: "border-primary" },
];

// Fake friends
const MOCK_FRIENDS = [
  { name: "NeonRazor",  status: "online" },
  { name: "V_Specter",  status: "online" },
  { name: "CyberDruid", status: "offline" },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const { user: me } = useAuth();
  const userId = searchParams.get("id") ?? me?.id;
  const isOwn = userId === me?.id;

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!userId) return;
    userApi.getProfile(userId)
      .then(p => { setProfile(p); setDisplayName(p.displayName); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  async function saveProfile() {
    if (!profile) return;
    const updated = await userApi.updateProfile(profile.id, { displayName });
    setProfile(updated);
    setEditing(false);
  }

  if (loading) return <Loading />;
  if (!profile)  return <NotFound />;

  const xpProgress     = (profile.xp % 1000) / 10;
  const xpCircumference = 2 * Math.PI * 88; // r=88
  const xpOffset        = xpCircumference - (xpProgress / 100) * xpCircumference;
  const winRate         = profile.wins + profile.losses > 0
    ? Math.round(profile.wins / (profile.wins + profile.losses) * 100)
    : 0;

  return (
    <div className="flex min-h-screen">
      <main className="flex-grow p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* ── Hero section ──────────────────────────────────────────── */}
          <section className="relative mb-12 overflow-hidden rounded-xl bg-surface-container-low min-h-[400px] flex items-end">
            {/* Background gradient stand-in (no external image dependency) */}
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/5 to-tertiary/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>

            <div className="relative z-10 p-10 flex flex-col md:flex-row items-end gap-8 w-full">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-40 h-40 rounded-xl border-4 border-primary bg-surface shadow-[0_0_30px_rgba(143,245,255,0.2)] flex items-center justify-center">
                  <span className="font-headline font-black text-6xl text-primary">
                    {profile.username[0].toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-secondary p-2 rounded-lg border-2 border-background shadow-lg">
                  <span className="material-symbols-outlined text-background text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    military_tech
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-2">
                  {editing && isOwn ? (
                    <input
                      className="bg-surface-container-low text-on-surface font-headline font-black text-3xl tracking-tight p-2 outline-none border-b border-primary"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <h1 className="font-headline text-5xl font-black tracking-tight text-white uppercase italic">
                      {profile.displayName}
                    </h1>
                  )}
                  <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-headline text-xs font-bold tracking-widest rounded-full uppercase">
                    PRO_LEAGUE
                  </span>
                </div>
                <p className="font-body text-on-surface-variant max-w-md mb-6 text-sm">
                  @{profile.username} · Master of the Digital Grid. Member since 2024.
                </p>
                <div className="flex gap-12">
                  <div className="flex flex-col">
                    <span className="font-headline text-primary text-3xl font-bold italic">{profile.xp.toLocaleString()}</span>
                    <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">XP RATING</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline text-secondary text-3xl font-bold italic">{winRate}%</span>
                    <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">WIN RATIO</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline text-tertiary text-3xl font-bold italic">#{profile.rank}</span>
                    <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">GLOBAL RANK</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {isOwn && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 border border-outline-variant bg-surface-container-high font-headline text-xs font-bold tracking-widest text-white rounded hover:bg-surface-container-highest transition-colors uppercase"
                  >
                    Edit Profile
                  </button>
                )}
                {isOwn && editing && (
                  <>
                    <button
                      onClick={saveProfile}
                      className="px-6 py-3 bg-primary text-on-primary font-headline text-xs font-bold tracking-widest rounded hover:opacity-90 uppercase"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-6 py-3 border border-outline-variant bg-surface-container-high font-headline text-xs font-bold tracking-widest text-white rounded hover:bg-surface-container-highest uppercase"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {!isOwn && (
                  <button className="px-6 py-3 bg-primary text-on-primary font-headline text-xs font-bold tracking-widest rounded hover:opacity-90 uppercase">
                    Invite To Clan
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── XP / Level ring + stats ────────────────────────────────── */}
          <div className="mb-12">
            <div className="bg-surface-container-low p-10 rounded-xl relative overflow-hidden border border-outline-variant/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-10">

                  {/* Circular XP ring (matches Stitch SVG exactly) */}
                  <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                      <circle
                        className="text-surface-container-high"
                        cx="96" cy="96" r="88"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="12"
                      />
                      <circle
                        className="text-primary"
                        cx="96" cy="96" r="88"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray={xpCircumference}
                        strokeDashoffset={xpOffset}
                        strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 12px rgba(0,238,252,0.8))" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline text-5xl font-black italic text-white tracking-tighter">
                        LVL {profile.level}
                      </span>
                      <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">
                        {profile.xp % 1000}/{1000} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress bar + mini stats */}
                  <div className="flex-grow w-full">
                    <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-6">
                      <div>
                        <p className="font-headline font-black text-2xl text-on-surface">Experience Progress</p>
                        <p className="text-on-surface-variant text-sm">
                          {1000 - (profile.xp % 1000)} XP until Level {profile.level + 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-primary text-xl">{profile.xp.toLocaleString()} XP</p>
                        <p className="text-on-surface-variant text-xs tracking-widest uppercase">Total Earned</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full bg-surface-container-high h-4 rounded-full overflow-hidden p-1 border border-outline-variant/20">
                        <div
                          className="bg-gradient-to-r from-primary via-primary-dim to-primary h-full rounded-full shadow-[0_0_15px_rgba(0,238,252,0.4)] transition-all duration-700"
                          style={{ width: `${xpProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                          <span className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                            Season Progress
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant font-bold">{xpProgress.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Mini stat grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      {[
                        { label: "MATCHES_PLAYED", value: profile.wins + profile.losses, color: "text-primary" },
                        { label: "VICTORIES",       value: profile.wins,                  color: "text-secondary" },
                        { label: "DEFEATS",         value: profile.losses,                color: "text-tertiary" },
                        { label: "WIN_RATE",        value: `${winRate}%`,                color: "text-white" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-surface-container-high/50 p-4 rounded-lg border border-outline-variant/10">
                          <div className={`${color} font-headline text-xl font-bold italic`}>{value}</div>
                          <div className="text-on-surface-variant font-label text-[8px] tracking-[0.2em] uppercase">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Match history + friends ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Match history */}
            <div className="lg:col-span-2">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-headline font-bold text-on-surface tracking-tight">Match_History</h2>
                <button className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant hover:text-white uppercase">
                  VIEW_ALL
                </button>
              </div>
              <div className="space-y-4">
                {MOCK_HISTORY.map((match, i) => (
                  <div
                    key={i}
                    className={`bg-surface-container-low hover:bg-surface-container-high transition-colors p-5 flex items-center gap-6 border-l-4 ${match.border}`}
                  >
                    <div className="flex flex-col items-center gap-1 w-16 flex-shrink-0">
                      <span className={`font-headline font-black text-sm ${match.border === "border-primary" ? "text-primary" : "text-error"}`}>
                        {match.result}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-bold">{match.score}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center font-headline font-bold text-on-surface-variant">
                          {match.opponent[0]}
                        </div>
                        <div>
                          <p className="font-body font-semibold text-sm text-on-surface">{match.opponent}</p>
                          <p className="text-[10px] text-on-surface-variant">{match.duration}</p>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Friends list */}
            <div className="bg-surface-container-low p-6 rounded-xl flex flex-col h-fit">
              <h2 className="font-headline font-bold text-on-surface tracking-tight mb-6">Online_Roster</h2>
              <div className="space-y-6">
                {MOCK_FRIENDS.map((friend) => (
                  <div key={friend.name} className={`flex items-center gap-4 group cursor-pointer ${friend.status === "offline" ? "opacity-40" : ""}`}>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border border-primary/20 bg-surface-container-highest flex items-center justify-center font-headline font-bold text-on-surface-variant">
                        {friend.name[0]}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
                          friend.status === "online"
                            ? "bg-primary shadow-[0_0_8px_#00eefc]"
                            : "bg-outline-variant"
                        }`}
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-body font-semibold text-sm text-on-surface">{friend.name}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{friend.status}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:text-primary transition-colors">
                      chat_bubble
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-10 py-3 border border-outline-variant text-[10px] font-bold tracking-widest text-on-surface-variant uppercase hover:bg-surface-container-high hover:text-white transition-all">
                VIEW_FULL_ROSTER
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="font-headline font-black text-5xl italic tracking-widest text-violet-500 animate-pulse">LOADING…</span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="font-headline font-bold text-on-surface-variant tracking-widest">PROFILE_NOT_FOUND</span>
    </div>
  );
}
