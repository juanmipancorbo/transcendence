"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { friendApi, userApi } from "@/lib/api";
import { getTokens } from "@/hooks/useAuth";
import type { PublicUser } from "@/types";

type RelationStatus = "loading" | "friends" | "request-sent" | "request-received" | "none";

const ERROR_LABELS: Record<string, string> = {
  ALREADY_FRIENDS:    "You're already friends",
  ALREADY_REQUESTED:  "Request already sent",
  REQUEST_NOT_FOUND:  "No pending request found",
  NOT_FRIENDS:        "Not in your friends list",
  INVALID_CREDENTIAL: "You can't add yourself",
};

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  for (const [code, label] of Object.entries(ERROR_LABELS))
    if (msg.includes(code)) return label;
  return "Something went wrong";
}

const STATUS_COLOR: Record<PublicUser["status"], string> = {
  online:  "var(--primary)",
  busy:    "#d575ff",
  offline: "var(--outline-variant)",
};

const STATUS_LABEL: Record<PublicUser["status"], string> = {
  online:  "Online",
  busy:    "Busy",
  offline: "Offline",
};

export default function FriendProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [profile,  setProfile]  = useState<PublicUser | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relation,  setRelation]  = useState<RelationStatus>("loading");
  const [busy,      setBusy]      = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(err: unknown) {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setErrorMsg(friendlyError(err));
    errorTimer.current = setTimeout(() => setErrorMsg(null), 3500);
  }

  const loadRelation = useCallback(async (token: string, id: string) => {
    const [isFriend, incoming, outgoing] = await Promise.all([
      friendApi.isFriend(token, id),
      friendApi.getIncomingRequests(token),
      friendApi.getOutgoingRequests(token),
    ]);
    if (isFriend)
      setRelation("friends");
    else if (outgoing.some(u => u.id === id))
      setRelation("request-sent");
    else if (incoming.some(u => u.id === id))
      setRelation("request-received");
    else
      setRelation("none");
  }, []);

  useEffect(() => {
    if (!userId) { setNotFound(true); setLoading(false); return; }
    const token = getTokens()?.accessToken;
    if (!token)  { setNotFound(true); setLoading(false); return; }

    setLoading(true);
    Promise.all([
      userApi.getProfile(userId),
      loadRelation(token, userId),
    ])
      .then(([p]) => { setProfile(p); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId, loadRelation]);

  async function handleAddFriend() {
    const token = getTokens()?.accessToken;
    if (!token || !userId) return;
    setBusy(true);
    try {
      await friendApi.sendRequest(token, userId);
      setRelation("request-sent");
    } catch (err) { showError(err); }
    setBusy(false);
  }

  async function handleCancelRequest() {
    const token = getTokens()?.accessToken;
    if (!token || !userId) return;
    setBusy(true);
    try {
      await friendApi.cancelRequest(token, userId);
      setRelation("none");
    } catch (err) { showError(err); }
    setBusy(false);
  }

  async function handleAccept() {
    const token = getTokens()?.accessToken;
    if (!token || !userId) return;
    setBusy(true);
    try {
      await friendApi.acceptRequest(token, userId);
      setRelation("friends");
    } catch (err) { showError(err); }
    setBusy(false);
  }

  async function handleDecline() {
    const token = getTokens()?.accessToken;
    if (!token || !userId) return;
    setBusy(true);
    try {
      await friendApi.declineRequest(token, userId);
      setRelation("none");
    } catch (err) { showError(err); }
    setBusy(false);
  }

  async function handleRemoveFriend() {
    const token = getTokens()?.accessToken;
    if (!token || !userId) return;
    setBusy(true);
    try {
      await friendApi.removeFriend(token, userId);
      setRelation("none");
    } catch (err) { showError(err); }
    setBusy(false);
  }

  const matchesPlayed = profile ? profile.gamesWon + profile.gamesLost : 0;
  const victories     = profile?.gamesWon ?? 0;

  return (
    <>
      <main className="flex-grow p-12 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">

          {loading && (
            <p className="text-on-surface-variant italic text-center mt-24">Loading profile…</p>
          )}

          {!loading && notFound && (
            <p className="text-on-surface-variant italic text-center mt-24">User not found.</p>
          )}

          {!loading && profile && (
            <>
              {/* ── Identity card ─────────────────────────────────────────── */}
              <section className="profile-card">

                {/* Avatar */}
                <div className="profile-avatar-frame">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Profile picture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-black" style={{ color: "var(--primary)", fontFamily: "Space Grotesk, sans-serif" }}>
                        {(profile.username ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow text-center md:text-left">
                  <h1 className="profile-username mb-2">{profile.username}</h1>

                  {/* Status */}
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[profile.status] }} />
                    <span className="text-xs text-on-surface-variant">{STATUS_LABEL[profile.status]}</span>
                  </div>

                  <p className="profile-bio mb-4">
                    <span className="text-on-surface-variant/40 italic">No bio yet.</span>
                  </p>

                  {/* Friend action */}
                  <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex justify-center md:justify-start gap-3 flex-wrap">
                    {profile.status === "busy" && profile.currentGame && (
                      <button
                        onClick={() => window.open(`/game?id=${profile.currentGame}`, "_blank")}
                        className="profile-edit-btn"
                      >
                        Watch Game
                      </button>
                    )}
                    {relation === "none" && (
                      <button onClick={handleAddFriend} disabled={busy} className="profile-edit-btn">
                        Add Friend
                      </button>
                    )}
                    {relation === "request-sent" && (
                      <button onClick={handleCancelRequest} disabled={busy} className="profile-edit-btn">
                        Cancel Request
                      </button>
                    )}
                    {relation === "request-received" && (
                      <>
                        <button onClick={handleAccept} disabled={busy} className="btn-primary" style={{ width: "auto", padding: "0.75rem 2rem" }}>
                          Accept
                        </button>
                        <button onClick={handleDecline} disabled={busy} className="profile-edit-btn">
                          Decline
                        </button>
                      </>
                    )}
                    {relation === "friends" && (
                      <button onClick={handleRemoveFriend} disabled={busy} className="profile-edit-btn">
                        Remove Friend
                      </button>
                    )}
                  </div>
                  {errorMsg && (
                    <p className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {errorMsg}
                    </p>
                  )}
                  </div>
                </div>
              </section>

              {/* ── Stats grid ────────────────────────────────────────────── */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="profile-stat-card">
                  <div className="profile-stat-value" style={{ color: "var(--primary)" }}>
                    {matchesPlayed}
                  </div>
                  <div className="profile-stat-label">Matches_Played</div>
                </div>

                <div className="profile-stat-card secondary">
                  <div className="profile-stat-value" style={{ color: "var(--secondary)" }}>
                    {victories}
                  </div>
                  <div className="profile-stat-label">Victories</div>
                </div>
              </section>
            </>
          )}

        </div>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[10%] w-[50%] h-[50%] blur-[120px]" style={{ background: "rgba(0,238,252,0.03)"   }} />
        <div className="ambient-blob -bottom-[5%]  -left-[5%]  w-[40%] h-[40%] blur-[100px]" style={{ background: "rgba(172,138,255,0.03)" }} />
      </div>
    </>
  );
}
