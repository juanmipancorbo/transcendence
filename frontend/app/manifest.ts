import type { MetadataRoute } from "next";
import {
  BRAND_COLOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  THEME_COLOR,
} from "@/lib/seo";

/**
 * Served at /manifest.webmanifest.
 *
 * Makes the game installable and gives Lighthouse's PWA/best-practices
 * audits the icons and colours they look for — those audits feed the
 * quality signals that sit alongside pure SEO.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Play Reversi Online`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: THEME_COLOR,
    theme_color: BRAND_COLOR,
    categories: ["games", "entertainment"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        // Safe-zone padded so Android can crop it to any device mask.
        purpose: "maskable",
      },
    ],
  };
}
