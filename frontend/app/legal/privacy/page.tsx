import type { Metadata } from "next";
import PrivacyDocument from "@/components/legal/PrivacyDocument";
import { pageMetadata, SITE_NAME } from "@/lib/seo";

/**
 * Canonical public copy of the privacy policy. The in-app /privacy route
 * renders the same document behind auth and is excluded from indexing.
 */
export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, stores and uses your personal data, including account details, match history and your rights over that data.`,
  path: "/legal/privacy",
  socialTitle: `Privacy Policy — ${SITE_NAME}`,
  socialDescription: `How ${SITE_NAME} collects, stores and uses your personal data.`,
  robots: {
    index: true,
    follow: true,
    "max-snippet": 0,
  },
});

export default function PublicPrivacyPage() {
  return <PrivacyDocument publicNavigation />;
}
