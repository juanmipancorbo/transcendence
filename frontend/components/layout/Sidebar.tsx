"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/lobby",       label: "Lobby",       icon: "sports_esports" },
  { href: "/leaderboard", label: "Leaderboard",  icon: "leaderboard" },
  { href: "/profile",     label: "Profile",      icon: "person_search" },
  { href: "/terms",       label: "Policy",       icon: "gavel" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#0e0e13] flex flex-col py-10 z-50"
           style={{ boxShadow: "20px 0 60px -15px rgba(40,0,103,0.1)" }}>
      <nav className="flex-grow flex flex-col">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "sidebar-item-active py-4 px-6 flex items-center gap-4 font-headline text-xs font-bold tracking-[0.2em] uppercase"
                  : "text-slate-600 py-4 px-6 hover:bg-slate-800/50 hover:text-white transition-all flex items-center gap-4 font-headline text-xs font-bold tracking-[0.2em] uppercase"
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Find Match CTA + Logout */}
      <div className="px-6 mt-auto flex flex-col gap-3">
        <Link
          href="/lobby"
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-headline font-bold text-xs tracking-widest uppercase text-center transition-transform active:scale-95"
          style={{ display: "block" }}
        >
          FIND MATCH
        </Link>
        <button
          onClick={handleLogout}
          className="w-full py-2 text-[10px] font-headline font-bold tracking-widest uppercase text-slate-600 hover:text-slate-400 transition-colors"
        >
          LOG OUT
        </button>
      </div>
    </aside>
  );
}
