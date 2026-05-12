"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call authApi.register(), then redirect
    router.push("/lobby");
  }

  const FIELDS = [
    { key: "username"        as const, label: "Pilot_Handle",  type: "text",     placeholder: "USERNAME"        },
    { key: "email"           as const, label: "Neural_Link",   type: "email",    placeholder: "EMAIL ADDRESS"   },
    { key: "password"        as const, label: "Access_Code",   type: "password", placeholder: "MIN 8 CHARS"     },
    { key: "confirmPassword" as const, label: "Confirm_Code",  type: "password", placeholder: "REPEAT PASSWORD" },
  ];

  return (
    <div className="page-root">
      <div className="page-glow-layer">
        <div className="page-glow-tr" />
        <div className="page-glow-bl" />
      </div>

      <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <div className="wordmark">FT_TRANSCENDANCE</div>
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <Link href="/login" className="label-micro hover:text-primary transition-colors">
              ← Back_to_Login
            </Link>
            <h1 className="mt-4 text-5xl font-headline font-bold tracking-tighter text-on-surface">
              CREATE_
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                ACCOUNT
              </span>
            </h1>
          </div>

          <div className="glass-panel p-10 rounded-lg border border-outline-variant/10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} className="field-group">
                  <label className="field-label">{label}</label>
                  <div className="field-wrap">
                    <input
                      type={type}
                      placeholder={placeholder}
                      className="field-input"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                    <div className="field-underline" />
                  </div>
                </div>
              ))}

              <button type="submit" className="btn-primary mt-4">
                Initialize_Account
              </button>
            </form>

            <p className="text-center mt-6 label-micro tracking-wider">
              By registering you accept our{" "}
              <Link href="/terms" className="text-on-surface underline underline-offset-4">
                Operating_Directives
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
