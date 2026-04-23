"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/lobby");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark bg-surface font-body text-on-surface overflow-hidden min-h-screen">

      {/* ── Hero background glows ───────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[80%] bg-gradient-to-bl from-secondary-container/20 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[70%] bg-gradient-to-tr from-primary/10 to-transparent blur-[100px]" />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="w-full top-0 sticky z-50 bg-transparent backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-6 w-full max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black italic tracking-widest text-violet-500 font-headline uppercase">
            FT_TRANSCENDANCE
          </div>
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-violet-300 transition-colors duration-300">notifications</span>
            <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-violet-300 transition-colors duration-300">settings</span>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-center">

          {/* Left: Visual narrative */}
          <div className="hidden lg:flex flex-col lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="text-primary font-headline text-sm font-bold tracking-[0.4em] uppercase">
                System_Status: Online
              </span>
              <h1 className="text-7xl font-headline font-bold text-on-surface tracking-tighter leading-[0.9]">
                ENTER THE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                  VOID_PROTOCOL
                </span>
              </h1>
            </div>

            <div className="flex gap-12 items-start mt-8">
              <div className="space-y-1">
                <div className="text-4xl font-headline font-bold text-primary-fixed">14.2k</div>
                <div className="text-xs font-label text-on-surface-variant tracking-widest uppercase">Active_Pilots</div>
              </div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-12">
                <div className="text-4xl font-headline font-bold text-secondary">0.03s</div>
                <div className="text-xs font-label text-on-surface-variant tracking-widest uppercase">Match_Latency</div>
              </div>
            </div>

            {/* Featured card */}
            <div className="relative group mt-12 w-4/5">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg opacity-20 blur-sm group-hover:opacity-40 transition duration-1000" />
              <div className="relative bg-surface-container-low p-6 rounded-lg flex items-center gap-6">
                <div className="w-16 h-16 rounded bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">sports_esports</span>
                </div>
                <div>
                  <p className="text-on-surface font-headline font-bold uppercase tracking-wider">Tournament_Alert</p>
                  <p className="text-on-surface-variant text-sm">Velocity League Season 4 starts in 02:45:12</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Auth portal */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel p-10 rounded-lg border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant tracking-[0.2em] uppercase pl-1">
                    Pilot_Identity
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-low border-none focus:ring-0 text-on-surface font-label text-sm p-4 placeholder:text-outline-variant outline-none"
                      placeholder="USERNAME OR EMAIL"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant tracking-[0.2em] uppercase pl-1">
                    Access_Code
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-low border-none focus:ring-0 text-on-surface font-label text-sm p-4 placeholder:text-outline-variant outline-none"
                      placeholder="PASSWORD"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-label" style={{ color: "#d73357" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-headline font-bold tracking-[0.3em] rounded-lg shadow-[0_0_20px_rgba(0,238,252,0.3)] hover:shadow-[0_0_35px_rgba(0,238,252,0.5)] transition-all active:scale-[0.98] uppercase mt-8 disabled:opacity-50"
                >
                  {loading ? "Initializing…" : "Initialize_Login"}
                </button>
              </form>

              <p className="text-center mt-8 text-[10px] font-label text-on-surface-variant tracking-wider leading-relaxed">
                No account?{" "}
                <Link href="/register" className="text-on-surface underline underline-offset-4 decoration-primary-dim/40 hover:decoration-primary-dim">
                  Register_Now
                </Link>
                {" · "}
                <Link href="/terms" className="text-on-surface underline underline-offset-4 decoration-primary-dim/40 hover:decoration-primary-dim">
                  Operating_Directives
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative corner elements */}
      <div className="fixed bottom-10 left-10 z-0 flex flex-col gap-4 opacity-30 pointer-events-none">
        <div className="w-32 h-[1px] bg-gradient-to-r from-primary to-transparent" />
        <div className="w-24 h-[1px] bg-gradient-to-r from-secondary to-transparent" />
        <div className="w-40 h-[1px] bg-gradient-to-r from-tertiary to-transparent" />
      </div>
      <div className="fixed top-1/2 -right-4 transform -rotate-90 z-0 pointer-events-none">
        <span className="text-[8px] font-headline font-bold text-on-surface-variant/20 tracking-[1em] uppercase">
          SYSTEM_ARCH_X99_TERMINAL_ACTIVE
        </span>
      </div>
    </div>
  );
}
