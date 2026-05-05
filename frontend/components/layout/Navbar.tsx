"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/lobby",       label: "LOBBY" },
  { href: "/leaderboard", label: "RANKINGS" },
  { href: "/profile",     label: "PROFILE" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: "rgba(14,14,19,0.85)", backdropFilter: "blur(20px)" }}>
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/lobby" className="flex items-center gap-2 group">
          {/* 8×8 mini board icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect width="20" height="20" rx="2" fill="var(--surface-container-high)" />
            <rect x="2" y="2" width="7" height="7" rx="1" fill="var(--primary)" opacity="0.9" />
            <rect x="11" y="2" width="7" height="7" rx="1" fill="var(--surface-container-highest)" />
            <rect x="2" y="11" width="7" height="7" rx="1" fill="var(--surface-container-highest)" />
            <rect x="11" y="11" width="7" height="7" rx="1" fill="var(--primary)" opacity="0.9" />
          </svg>
          <span
            className="font-display font-bold text-sm tracking-widest uppercase"
            style={{ color: "var(--on-surface)" }}
          >
            Reversi
          </span>
        </Link>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "btn btn-tertiary text-xs",
                    active && "!text-primary"
                  )}
                  style={active ? { color: "var(--primary)" } : { color: "var(--on-surface-variant)" }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User area */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              {/* Status dot */}
              <span className="w-1.5 h-1.5 rounded-full dot-online" />
              <span className="font-body text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                {user.username}
              </span>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="btn btn-secondary text-xs px-3 py-1.5"
          >
            LOG OUT
          </button>
        </div>
      </nav>
    </header>
  );
}
