import type { MetadataRoute } from "next";
import { absoluteUrl, PRIVATE_PATH_PREFIXES } from "@/lib/seo";

/**
 * Served at /robots.txt.
 *
 * Auth-gated routes are disallowed because a crawler only ever sees a
 * loading spinner there — indexing them would spend crawl budget to
 * publish empty pages. These are bare prefixes, so `/lobby` also covers
 * `/lobby/anything`, and every crawler understands that form.
 *
 * robots.txt only stops crawling, not indexing: a disallowed URL linked
 * from elsewhere can still be listed. The noindex header on the (logged)
 * layout is what actually keeps those routes out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATH_PREFIXES,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
