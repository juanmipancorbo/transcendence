import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

/**
 * Renders a JSON-LD block. Search engines read these from the raw HTML,
 * so this stays a server component with no hydration cost.
 *
 * `JSON.stringify` output is escaped before it reaches the DOM: a literal
 * `</script>` inside any string value would otherwise close the tag early
 * and let the remaining payload run as markup.
 */
export default function JsonLd({ schema }: { schema: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Describes the site itself. `@id` values are stable URIs so the separate
 * nodes below can reference each other instead of repeating themselves.
 */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
};

/**
 * Describes the product. `VideoGame` is the closest schema.org type for a
 * browser-based multiplayer board game and unlocks richer game results.
 */
export const gameSchema = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "@id": `${SITE_URL}/#game`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: absoluteUrl("/opengraph-image"),
  applicationCategory: "GameApplication",
  genre: ["Board Game", "Strategy", "Multiplayer"],
  gamePlatform: "Web Browser",
  operatingSystem: "Any (web browser)",
  playMode: ["MultiPlayer", "CoOp"],
  numberOfPlayers: {
    "@type": "QuantitativeValue",
    minValue: 2,
    maxValue: 2,
  },
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};
