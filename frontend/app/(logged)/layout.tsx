"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokens, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar  from "@/components/layout/TopBar";
import { GameSocket } from "@/lib/ws/socket";
import { Chat, WsContext } from "@/hooks/useWs";
import { WS_URL } from "@/lib/config";
import { useMsg } from "@/hooks/useMsg";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { message, error } = useMsg();
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [chats, setChats] = useState<Map<string, Chat>>(new Map());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

	const tokens = getTokens();
	if (!socket && isAuthenticated && tokens) {
      const sock = new GameSocket(WS_URL + "/ws/create", tokens.accessToken, (e) => {
		if (e) return setFatalError(`Connection error: ${e.message}`);
		setSocket(sock);
	  });
	}
  }, [isAuthenticated, isLoading, router]);

  if (fatalError) {
    return (
      <div className="dark min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 label-micro">{fatalError}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !socket || !socket.isConnected) {
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
    return <></>;
  }

  return (
    <div className="dark min-h-screen bg-background text-on-surface">
	    <div className="ml-64 flex flex-col min-h-screen">
          <TopBar withSidebar />
          <main className="flex-1">
		    <WsContext.Provider value={{ socket, chats }}>
			  {children}
		    </WsContext.Provider>
          </main>
        </div>
      <Sidebar />
    </div>
  );
}
