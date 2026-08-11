import type { Metadata } from "next";
import TermsDocument from "@/components/legal/TermsDocument";
import { pageMetadata, SITE_NAME } from "@/lib/seo";

/**
 * Canonical public copy of the terms. The in-app /terms route renders the
 * same document behind auth and is excluded from indexing, so this URL is
 * the only one search engines should ever see.
 */
export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: `The terms of service governing your use of ${SITE_NAME}, including account rules, fair play and account termination.`,
  path: "/legal/terms",
  socialTitle: `Terms of Service — ${SITE_NAME}`,
  socialDescription: `The terms of service governing your use of ${SITE_NAME}.`,
  robots: {
    index: true,
    follow: true,
    // Legal boilerplate should never win a snippet over the product pages.
    "max-snippet": 0,
  },
});

export default function PublicTermsPage() {
  return <TermsDocument publicNavigation />;
}
