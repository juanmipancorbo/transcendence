const TOKEN_KEY = "auth_tokens";
let tokenMemory: { accessToken: string; refreshToken: string } | null = null;

export function getTokens(): { accessToken: string; refreshToken: string } | null {
	if (tokenMemory) return tokenMemory;
	if (typeof window === "undefined") return null;
	const stored = localStorage.getItem(TOKEN_KEY);
	return stored ? JSON.parse(stored) : null;
}

export function setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
	tokenMemory = tokens;
	if (typeof window === "undefined") return;
	if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
	else localStorage.removeItem(TOKEN_KEY);
}
