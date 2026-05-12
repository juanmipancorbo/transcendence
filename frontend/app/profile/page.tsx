"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call authApi.login(username, password), then redirect
    router.push("/lobby");
  }

  return (
    <div className="page-root">

      <div className="page-glow-layer">
        <div className="page-glow-tr" />
        <div className="page-glow-bl" />
      </div>

      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <div className="wordmark">FT_TRANSCENDANCE</div>
          <div className="flex items-center gap-6">
            <span className="topbar-icon material-symbols-outlined topbar-icon">notifications</span>
            <span className="topbar-icon material-symbols-outlined topbar-icon">settings</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-center">

          {/* Left: hero */}
          <div className="hidden lg:flex flex-col lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <span className="label-micro accent tracking-[0.4em]">
                System_Status: Online
              </span>
              <h1 className="hero-title" style={{ fontSize: "4.5rem", lineHeight: 0.9 }}>
                ENTER THE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                  VOID_PROTOCOL
                </span>
              </h1>
            </div>
            <div className="flex gap-12 items-start mt-8">
              <div className="space-y-1">
                <div className="text-4xl font-headline font-bold text-primary-fixed">14.2k</div>
                <div className="label-micro">Active_Pilots</div>
              </div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-12">
                <div className="text-4xl font-headline font-bold text-secondary">0.03s</div>
                <div className="label-micro">Match_Latency</div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel p-10 rounded-lg border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <form className="space-y-6" onSubmit={handleSubmit}>

                <div className="field-group">
                  <label className="field-label">Pilot_Identity</label>
                  <div className="field-wrap">
                    <input
                      className="field-input"
                      placeholder="USERNAME OR EMAIL"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                    <div className="field-underline" />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Access_Code</label>
                  <div className="field-wrap">
                    <input
                      className="field-input"
                      placeholder="PASSWORD"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <div className="field-underline" />
                  </div>
                </div>

                <button type="submit" className="btn-primary mt-8">
                  Initialize_Login
                </button>
              </form>

              <p className="text-center mt-8 label-micro tracking-wider">
                No account?{" "}
                <Link href="/register" className="text-on-surface underline underline-offset-4">
                  Register_Now
                </Link>
                {" · "}
                <Link href="/terms" className="text-on-surface underline underline-offset-4">
                  Operating_Directives
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
