"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
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
    if (form.username.length < 3 || form.username.length > 16)
      validationErrors.push("Username must be between 3 and 16 characters");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      validationErrors.push("Email address is invalid");
    if (form.password.length < 8 || form.password.length > 16)
      validationErrors.push("Password must be between 8 and 16 characters");
    if (!/[a-z]/.test(form.password))
      validationErrors.push("Password needs at least one lowercase letter");
    if (!/[A-Z]/.test(form.password))
      validationErrors.push("Password needs at least one uppercase letter");
    if (!/[0-9]/.test(form.password))
      validationErrors.push("Password needs at least one number");
    if (!/[^a-zA-Z0-9]/.test(form.password))
      validationErrors.push("Password needs at least one symbol");
    if (form.password !== form.confirmPassword) {
      validationErrors.push("Passwords do not match");
    }
    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
      return;
    }

    try {
      await register(form.email, form.username, form.password);
      router.push("/lobby");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  const FIELDS = [
    { key: "username"        as const, label: "Username", type: "text",     placeholder: "USERNAME",       autoComplete: "username" },
    { key: "email"           as const, label: "Email",    type: "email",    placeholder: "EMAIL ADDRESS",  autoComplete: "email" },
    { key: "password"        as const, label: "Password", type: "password", placeholder: "MIN 8 CHARS",    autoComplete: "new-password" },
    { key: "confirmPassword" as const, label: "Confirm password", type: "password", placeholder: "REPEAT PASSWORD", autoComplete: "new-password" },
  ];

  return (
    <div className="pixel-auth page-root">
      <div className="page-glow-layer">
        <div className="page-glow-tr" />
        <div className="page-glow-bl" />
      </div>

      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <div className="wordmark">REVERSI CLUB</div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <Link href="/login" className="label-micro hover:text-primary transition-colors">
              Back to sign in
            </Link>
            <h1 className="mt-4 text-5xl font-headline font-bold tracking-tighter text-on-surface">
              CREATE YOUR
              <span> ACCOUNT</span>
            </h1>
          </div>

          <div className="pixel-auth-card glass-panel p-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {FIELDS.map(({ key, label, type, placeholder, autoComplete }) => (
                <div key={key} className="field-group">
                  <label htmlFor={`register-${key}`} className="field-label">{label}</label>
                  <div className="field-wrap">
                    <input
                      id={`register-${key}`}
                      name={key}
                      autoComplete={autoComplete}
                      type={type}
                      placeholder={placeholder}
                      className="field-input"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      required
                    />
                    <div className="field-underline" />
                  </div>
                </div>
              ))}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm space-y-1">
                  {errorLines.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}

              <button type="submit" className="retro-shell auth btn-primary mt-4" disabled={mounted ? isLoading : false}>
                {mounted && isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <p className="text-center mt-6 label-micro tracking-wider">
              By registering you accept our{" "}
              <Link href="/legal/terms" className="text-on-surface underline underline-offset-4">Terms</Link>
              {" and "}
              <Link href="/legal/privacy" className="text-on-surface underline underline-offset-4">Privacy Policy</Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
