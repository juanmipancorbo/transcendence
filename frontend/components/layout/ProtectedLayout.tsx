"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar  from "@/components/layout/TopBar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export default function ProtectedLayout({ children, activeRoute }: ProtectedLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 label-micro">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dark min-h-screen bg-background text-on-surface">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <TopBar withSidebar activeRoute={activeRoute} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
