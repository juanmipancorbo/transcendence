import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OG_IMAGE_ALT } from "@/lib/seo";

/**
 * Shared social-card renderer for app/opengraph-image.tsx and
 * app/twitter-image.tsx, so both surfaces stay visually identical.
 *
 * 1200x630 is the 1.91:1 ratio Facebook, LinkedIn, Slack and Twitter's
 * `summary_large_image` card all crop to.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

const SURFACE = "#211e1b";
const GOLD = "#d5a62b";
const CREAM = "#f4e7c5";
const MUTED = "#a99e88";

/** Board layout for the decorative mini-game: 0 empty, 1 cream, 2 gold. */
const BOARD: number[][] = [
  [0, 0, 2, 0],
  [0, 1, 2, 0],
  [0, 2, 1, 1],
  [0, 0, 1, 0],
];

export async function renderOgImage() {
  // Reuse the interface font so the card matches the product. Read from
  // disk rather than fetched, which keeps this working offline and in the
  // Docker build where there is no network.
  const mono = await readFile(
    join(process.cwd(), "public/fonts/LiberationMono-Bold.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: SURFACE,
          padding: "72px 80px",
          border: `12px solid ${GOLD}`,
          fontFamily: "Retro Mono",
        }}
      >
        {/* Wordmark and pitch */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 8,
              color: GOLD,
              marginBottom: 24,
            }}
          >
            FT_TRANSCENDENCE
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              lineHeight: 1,
              color: CREAM,
            }}
          >
            <span>REVERSI</span>
            <span style={{ color: GOLD }}>CLUB</span>
          </div>
          <div
            style={{
              display: "flex",
              width: 180,
              height: 6,
              background: GOLD,
              margin: "36px 0",
            }}
          />
          <div style={{ display: "flex", fontSize: 27, lineHeight: 1.45, color: MUTED }}>
            Casual matchmaking, private duels, live chat and spectator mode.
          </div>
        </div>

        {/* Decorative board mid-game */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: `6px solid ${GOLD}`,
            background: "#191714",
          }}
        >
          {BOARD.map((row, y) => (
            <div key={y} style={{ display: "flex" }}>
              {row.map((cell, x) => (
                <div
                  key={x}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 92,
                    height: 92,
                    border: "2px solid #3a342c",
                  }}
                >
                  {cell !== 0 && (
                    <div
                      style={{
                        width: 62,
                        height: 62,
                        borderRadius: "50%",
                        background: cell === 1 ? CREAM : GOLD,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Retro Mono", data: mono, style: "normal", weight: 700 }],
    },
  );
}
