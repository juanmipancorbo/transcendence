import type { Metadata } from "next";
import { pageMetadata, SITE_NAME } from "@/lib/seo";

/**
 * page.tsx is a client component and cannot export metadata, so the route's
 * head tags live in this server layout instead.
 *
 * `/` server-redirects into the auth-gated app, which makes this the first
 * page a crawler or a shared link can actually render — hence the fuller,
 * product-level copy rather than a bare "Login".
 */
export const metadata: Metadata = pageMetadata({
  title: "Sign In — Play Reversi Online",
  description:
    "Sign in to Reversi Club to play Reversi (Othello) online. Casual matchmaking, " +
    "private duels with friends, live chat and a global leaderboard. Free to play in your browser.",
  path: "/login",
  socialTitle: `Sign In — ${SITE_NAME}`,
  socialDescription:
    "Sign in to play Reversi online against real opponents.",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
