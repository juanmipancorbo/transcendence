"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export default function ProtectedLayout({ children, activeRoute }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="font-headline font-bold text-5xl italic tracking-widest text-violet-500 animate-pulse">
          FT_TRANSCENDANCE
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="dark min-h-screen bg-background text-on-surface">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Content area pushed right of sidebar */}
      <div className="ml-64 flex flex-col min-h-screen">
        <TopBar withSidebar activeRoute={activeRoute} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
