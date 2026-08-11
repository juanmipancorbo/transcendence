import type { Metadata } from "next";

/**
 * OAuth redirect target. It is only ever reached with a `code` in the query
 * string and immediately bounces the user onward, so it must stay out of
 * the index — an indexed callback URL is a soft 404 at best.
 */
export const metadata: Metadata = {
  title: "Signing you in…",
  robots: { index: false, follow: false, nocache: true },
};

export default function GoogleCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
