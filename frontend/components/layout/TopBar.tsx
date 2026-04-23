"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  /** Pass true on pages that have a fixed left sidebar (w-64) */
  withSidebar?: boolean;
  activeRoute?: string;
}

const NAV_LINKS = [
  { href: "/lobby",       label: "Lobby" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile",     label: "Profile" },
];

export default function TopBar({ withSidebar = false, activeRoute }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header
      className={`w-full top-0 sticky z-40 bg-transparent backdrop-blur-xl bg-gradient-to-b from-[#0e0e13] to-transparent ${withSidebar ? "pl-64" : ""}`}
    >
      <div className="flex justify-between items-center px-8 py-6 w-full max-w-screen-2xl mx-auto">
        {/* Wordmark */}
        <div className="text-2xl font-black italic tracking-widest text-violet-500 font-headline uppercase select-none">
          FT_TRANSCENDANCE
        </div>

        {/* Nav (only on non-sidebar pages) */}
        {!withSidebar && (
          <nav className="hidden md:flex items-center gap-8 font-headline tracking-tighter uppercase text-xs">
            {NAV_LINKS.map(({ href, label }) => {
              const active = activeRoute === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active
                      ? "text-violet-400 font-bold border-b-2 border-violet-500 transition-colors duration-300 cursor-pointer"
                      : "text-slate-500 hover:text-violet-300 transition-colors duration-300 cursor-pointer"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-violet-300 transition-colors duration-300">
            notifications
          </span>
          <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-violet-300 transition-colors duration-300">
            settings
          </span>
          {user && (
            <div className="w-10 h-10 rounded-full border border-violet-500/30 overflow-hidden bg-surface-container-highest flex items-center justify-center font-headline font-bold text-sm text-primary">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
