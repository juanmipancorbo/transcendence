import type { Metadata } from "next";
import ProtectedShell from "@/components/layout/ProtectedShell";

/**
 * Every route in this group sits behind the auth gate and renders only a
 * loading spinner to a signed-out crawler. Inherited by all nested pages,
 * this emits `noindex, nofollow` for the whole group.
 *
 * robots.txt already discourages crawling these paths, but robots.txt only
 * blocks fetching — a URL linked from elsewhere can still be indexed
 * unfetched. This is the directive that actually keeps them out.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
