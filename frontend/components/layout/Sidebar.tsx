"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/lobby",       label: "Play"     },
  { href: "/leaderboard", label: "Rankings" },
  { href: "/profile",     label: "Profile"  },
  { href: "/terms",       label: "Terms"    },
  { href: "/privacy",     label: "Privacy"  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#0e0e13] flex flex-col py-10 z-50"
           style={{ boxShadow: "20px 0 60px -15px rgba(40,0,103,0.1)" }}>
      <nav className="flex-grow flex flex-col">
        {NAV_ITEMS.map(({ href, label }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
