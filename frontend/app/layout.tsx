import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { MsgProvider } from "@/hooks/useMsg";
import MsgBox from "@/components/layout/MsgBox";

export const metadata: Metadata = {
  title: "FT_TRANSCENDENCE | Reversi Club",
  description: "Online multiplayer Reversi with matchmaking, friends, chat, and spectator mode.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-surface antialiased">
        <AuthProvider>
          <MsgProvider>
            {children}
            <MsgBox />
          </MsgProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
