export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getWebSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL || "/api";
  if (!configuredUrl.startsWith("/")) return configuredUrl;
  if (typeof window === "undefined") return configuredUrl;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${configuredUrl}`;
}
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
export const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;
