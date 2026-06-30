"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  withSidebar?: boolean;
}

export default function TopBar({ withSidebar = false }: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className={`w-full top-0 sticky z-40 backdrop-blur-xl bg-gradient-to-b from-[#0e0e13] to-transparent ${withSidebar ? "" : ""}`}>
      <div className="flex justify-between items-center px-8 py-6 w-full">
        <div className="text-2xl font-black italic tracking-widest text-violet-500 font-headline uppercase select-none">
          FT_TRANSCENDENCE
        </div>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="w-10 h-10 rounded-full border border-violet-500/30 bg-surface-container-highest flex items-center justify-center font-headline font-bold text-sm text-primary hover:border-violet-400 transition-colors">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
