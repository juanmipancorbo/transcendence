import type { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";
import "../styles/globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { MsgProvider } from "@/hooks/useMsg";
import MsgBox from "@/components/layout/MsgBox";
import JsonLd, { gameSchema, websiteSchema } from "@/components/seo/JsonLd";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  THEME_COLOR,
} from "@/lib/seo";

export const metadata: Metadata = {
  // Makes every relative URL below (canonicals, OG images) resolve to an
  // absolute one, which the Open Graph and Twitter specs both require.
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} — Play Reversi Online`,
    // Child routes set only their own title; the brand suffix is appended here.
    template: `%s | ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "games",
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // Deliberately no default `alternates.canonical`. `/` server-redirects
  // into the app, so a canonical pointing there would resolve to a
  // redirect, and every route that inherited it (404s, the noindex app
  // routes) would claim the same wrong canonical. Indexable pages set
  // their own via pageMetadata().

  manifest: "/manifest.webmanifest",

  // Declared explicitly rather than via app/icon.* so the same files can be
  // referenced from manifest.ts by a stable, unhashed path.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },

  // Images are listed explicitly rather than left to the opengraph-image
  // file convention, so these objects stay complete when a child route
  // replaces them. See pageMetadata() in lib/seo.ts.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: "/",
    title: `${SITE_NAME} — Play Reversi Online`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Play Reversi Online`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Stops iOS Safari from turning usernames and scores into tel: links.
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Both weights render above the fold on every page. Preloading them starts
  // the fetch alongside the stylesheet rather than after it, taking a round
  // trip out of LCP. `crossOrigin` is required — fonts are always fetched in
  // CORS mode, and without it the preload is discarded and refetched.
  //
  // ReactDOM.preload() rather than a <link> element: rendering the element
  // makes React emit the tag twice, once hoisted and once in place.
  for (const weight of ["Regular", "Bold"]) {
    ReactDOM.preload(`/fonts/LiberationMono-${weight}.woff2`, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-surface antialiased">
        <JsonLd schema={websiteSchema} />
        <JsonLd schema={gameSchema} />
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
