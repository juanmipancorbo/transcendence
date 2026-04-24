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
    { key: "username"        as const, label: "Pilot_Handle",   type: "text",     placeholder: "USERNAME"         },
    { key: "email"           as const, label: "Neural_Link",    type: "email",    placeholder: "EMAIL ADDRESS"    },
    { key: "password"        as const, label: "Access_Code",    type: "password", placeholder: "MIN 8 CHARS"      },
    { key: "confirmPassword" as const, label: "Confirm_Code",   type: "password", placeholder: "REPEAT PASSWORD"  },
  ];

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
        </div>
      </header>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/login" className="text-[10px] font-headline font-bold tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors">
              ← Back_to_Login
            </Link>
            <h1 className="mt-4 text-5xl font-headline font-bold tracking-tighter text-on-surface">
              CREATE_<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ACCOUNT</span>
            </h1>
          </div>

          <div className="glass-panel p-10 rounded-lg border border-outline-variant/10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-2 group">
                  <label className="text-[10px] font-headline font-bold tracking-[0.2em] uppercase pl-1 text-on-surface-variant">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={type}
                      placeholder={placeholder}
                      className="w-full bg-surface-container-low text-on-surface font-label text-sm p-4 placeholder:text-outline-variant outline-none"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-headline font-bold tracking-[0.3em] rounded-lg shadow-[0_0_20px_rgba(0,238,252,0.3)] hover:shadow-[0_0_35px_rgba(0,238,252,0.5)] transition-all active:scale-[0.98] uppercase mt-4"
              >
                Initialize_Account
              </button>
            </form>
            <p className="text-center mt-6 text-[10px] font-label text-on-surface-variant tracking-wider">
              By registering you accept our{" "}
              <Link href="/terms" className="text-on-surface underline underline-offset-4">Operating_Directives</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
