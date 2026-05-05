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
    <div className="dark bg-surface font-body text-on-surface overflow-hidden min-h-screen">

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[80%] bg-gradient-to-bl from-secondary-container/20 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[70%] bg-gradient-to-tr from-primary/10 to-transparent blur-[100px]" />
      </div>

      <header className="w-full top-0 sticky z-50 bg-transparent backdrop-blur-xl">
        <div className="flex justify-between items-center px-8 py-6 w-full max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black italic tracking-widest text-violet-500 font-headline uppercase">
            FT_TRANSCENDANCE
          </div>
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-slate-500">notifications</span>
            <span className="material-symbols-outlined text-slate-500">settings</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl items-center">

          {/* Left: hero */}
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
          </div>

          {/* Right: form */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel p-10 rounded-lg border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant tracking-[0.2em] uppercase pl-1">
                    Pilot_Identity
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-low text-on-surface font-label text-sm p-4 placeholder:text-outline-variant outline-none"
                      placeholder="USERNAME OR EMAIL"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
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
                      className="w-full bg-surface-container-low text-on-surface font-label text-sm p-4 placeholder:text-outline-variant outline-none"
                      placeholder="PASSWORD"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-headline font-bold tracking-[0.3em] rounded-lg shadow-[0_0_20px_rgba(0,238,252,0.3)] hover:shadow-[0_0_35px_rgba(0,238,252,0.5)] transition-all active:scale-[0.98] uppercase mt-8"
                >
                  Initialize_Login
                </button>
              </form>

              <p className="text-center mt-8 text-[10px] font-label text-on-surface-variant tracking-wider">
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
