import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { MsgProvider } from "@/hooks/useMsg";
import MsgBox from "@/components/layout/MsgBox";

export const metadata: Metadata = {
  title: "FT_TRANSCENDANCE | Reversi Arena",
  description: "High-performance Reversi / Othello online — Velocity Noir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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
