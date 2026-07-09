"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const errorLines = error
    ? error.split(/;|\n/).map((line) => line.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/lobby");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationErrors = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      validationErrors.push("Email address is invalid");
    if (password.length === 0)
      validationErrors.push("Password is required");
    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
      return;
    }

    try {
      await login(email, password);
      router.push("/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  function googleLogin() {
    const state = window.crypto.randomUUID();
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
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
          </div>

          {/* Right: form */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel p-10 rounded-lg border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <form className="space-y-6" onSubmit={handleSubmit}>

                <div className="field-group">
                  <label htmlFor="login-email" className="field-label">Pilot_Identity</label>
                  <div className="field-wrap">
                    <input
                      id="login-email"
                      className="field-input"
                      placeholder="EMAIL ADDRESS"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <div className="field-underline" />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="login-password" className="field-label">Access_Code</label>
                  <div className="field-wrap">
                    <input
                      id="login-password"
                      className="field-input"
                      placeholder="PASSWORD"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <div className="field-underline" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm space-y-1">
                    {errorLines.map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                )}

                <button type="submit" className="btn-primary mt-8" disabled={isLoading}>
                  {isLoading ? "Initializing..." : "Initialize_Login"}
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-outline-variant/20" />
                  <span className="label-micro">or</span>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>

                <button onClick={googleLogin} type="button" className="btn-secondary" disabled={isLoading}>
                  <img src="/google.svg" alt="" className="w-5 h-5" />
                  Google_Login
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
