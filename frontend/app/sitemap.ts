import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_ROUTES } from "@/lib/seo";

/**
 * Served at /sitemap.xml.
 *
 * Only lists routes that render real content to a signed-out visitor —
 * a sitemap entry for an auth-gated page is a crawl-budget leak and, if
 * the crawler follows it, a soft-404 signal.
 *
 * `lastModified` uses build time: the pages are static, so a redeploy is
 * the only thing that can change them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(route => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
