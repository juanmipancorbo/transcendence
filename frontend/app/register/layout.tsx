import type { Metadata } from "next";
import { pageMetadata, SITE_NAME } from "@/lib/seo";

/** page.tsx is a client component, so the route's head tags live here. */
export const metadata: Metadata = pageMetadata({
  title: "Create a Free Account",
  description:
    "Create a free Reversi Club account and start playing Reversi (Othello) online in seconds. " +
    "Casual matchmaking, friend duels, chat and match history — no download required.",
  path: "/register",
  socialTitle: `Create a Free Account — ${SITE_NAME}`,
  socialDescription:
    "Join Reversi Club and play Reversi online against real opponents. Free to play.",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
