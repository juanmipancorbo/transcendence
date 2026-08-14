
import type { User, LeaderboardEntry, PublicUser, ChatMessage, UnreadChat, GameData, CompletedGameData, FullGame, RecreatedGame } from "@/types";
import { getTokens, setTokens } from "./auth-storage";

// Set up for real backend

import { API_URL, GOOGLE_REDIRECT_URI } from "./config";

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
};

// /google/login only hands out a session when the Google account already has a
// profile; otherwise it parks the account under the oauth state and waits for a
// username to be posted to /google/setup-username.
type GoogleAuthPayload = ({ setup: true } & AuthPayload) | { setup: false };

export type GoogleLoginResult =
  | { status: "authenticated"; accessToken: string; refreshToken: string; user: Partial<User> }
  | { status: "username-required" };

let refreshPromise: Promise<string | null> | null = null;

function accessTokenExpiresSoon(token: string): boolean {
  try {
    const encoded = token.split(".")[1];
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return false;
  }
}

function refreshStoredAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens?.refreshToken) return null;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!response.ok) return null;

    const body = await response.json();
    const accessToken = body?.data?.accessToken;
    if (typeof accessToken !== "string") return null;

    setTokens({ accessToken, refreshToken: tokens.refreshToken });
    return accessToken;
  })().catch(() => null).finally(() => { refreshPromise = null; });

  return refreshPromise;
}

async function apiFetch<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers as Record<string, string>)) {
      headers[key] = value;
    }
  }

  const authorizationKey = Object.keys(headers).find(key => key.toLowerCase() === "authorization");
  if (authorizationKey) {
    const tokens = getTokens();
    let accessToken = tokens?.accessToken;
    if (accessToken && tokens?.refreshToken && accessTokenExpiresSoon(accessToken))
      accessToken = await refreshStoredAccessToken() ?? accessToken;
    if (accessToken) headers[authorizationKey] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !_isRetry) {
    const newAccessToken = await refreshStoredAccessToken();
    if (newAccessToken) {
      const retryHeaders = { ...(options?.headers as Record<string, string> ?? {}) };
      const key = Object.keys(retryHeaders).find(header => header.toLowerCase() === "authorization");
      if (key) retryHeaders[key] = `Bearer ${newAccessToken}`;
      return apiFetch<T>(path, { ...options, headers: retryHeaders }, true);
    }
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let json: any = null;

  if (contentType.includes("application/json") && text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  const rawError = json?.error ?? json?.message ?? (typeof json?.data === "string" ? json.data : null) ?? text;

  if (!res.ok) {
    const errorMessage = typeof rawError === "string" && rawError.trim().length > 0
      ? rawError
      : `API error: ${res.status}`;
    throw new Error(errorMessage);
  }

  if (json && typeof json === "object" && "success" in json && json.success === false) {
    const errorMessage = typeof rawError === "string" && rawError.trim().length > 0
      ? rawError
      : `API error: ${res.status}`;
    throw new Error(errorMessage);
  }

  return json as T;
}

//   Auth                      

export const authApi = {
  login: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
    const res = await apiFetch<{ success: boolean; data: AuthPayload }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    };
  },

  loginGoogle: async (code: string, state: string): Promise<GoogleLoginResult> => {
    const res = await apiFetch<{ success: boolean; data: GoogleAuthPayload }>("/google/login", {
      method: "POST",
      body: JSON.stringify({ code, state, redirect: window.location.origin + GOOGLE_REDIRECT_URI }),
    });
    if (!res.data.setup) {
      return { status: "username-required" };
    }
    return {
      status: "authenticated",
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    };
  },

  setupGoogleUsername: async (username: string, state: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
    const res = await apiFetch<{ success: boolean; data: AuthPayload }>("/google/setup-username", {
      method: "POST",
      body: JSON.stringify({ username, state }),
    });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    };
  },

  register: async (email: string, username: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
    const res = await apiFetch<{ success: boolean; data: AuthPayload }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    };
  },

  logout: async (refreshToken: string): Promise<void> => {
    const tokens = getTokens();
    await apiFetch("/auth/logout", {
      method: "POST",
      headers: tokens?.accessToken ? { "Authorization": `Bearer ${tokens.accessToken}` } : undefined,
      body: JSON.stringify({ refreshToken }),
    });
  },

  me: async (accessToken: string): Promise<User> => {
    return apiFetch<{ success: boolean; data: User }>("/auth/me", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    }).then(res => res.data);
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const res = await apiFetch<{ success: boolean; data: { accessToken: string } }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    return { accessToken: res.data.accessToken };
  },
};

//   User                      

export const userApi = {
  getProfile: async (userId: string): Promise<PublicUser> => {
    const res = await apiFetch<{ success: boolean; data: PublicUser }>(`/users/profile/${userId}`);
    return res.data;
  },

  getMatchHistory: async (limit: number, before?: Date): Promise<FullGame[]> => {
    const tokens = getTokens();
    const headers = tokens?.accessToken ? { "Authorization": `Bearer ${tokens.accessToken}` } : undefined;
	const params = new URLSearchParams({ limit: String(limit) });
	if (before) params.set("before", before.toISOString());

	const res = await apiFetch<{ success: boolean, data: FullGame[] }>(
		`/users/match-history?${params}`,
		{ method: "GET", headers },
	);

	return res.data;
  },

  getPublicMatchHistory: async (userId: string, limit: number, before?: Date): Promise<FullGame[]> => {
	const params = new URLSearchParams({ limit: String(limit) });
	if (before) params.set("before", before.toISOString());

	const res = await apiFetch<{ success: boolean, data: FullGame[] }>(
		`/users/match-history/${userId}?${params}`,
		{ method: "GET" },
	);

	return res.data;
  },

  updateProfile: async (_userId: string, data: Partial<User>): Promise<boolean> => {
    const tokens = getTokens();
    const headers = tokens?.accessToken ? { "Authorization": `Bearer ${tokens.accessToken}` } : undefined;

    if (data.username) {
      await apiFetch<{ success: boolean; data: null }>("/users/username", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ username: data.username }),
      });
    }

    if (data.bio !== undefined) {
      await apiFetch<{ success: boolean; data: null }>("/users/bio", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ bio: data.bio }),
      });
    }

    return true;
  },

  uploadAvatar: async (file: File, accessToken: string): Promise<string> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await apiFetch<{ success: boolean; data: { avatarUrl: string } }> ("/users/avatar", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      body: formData,
    });

    return res.data.avatarUrl;
  },

  checkUsernameAvailability: async (username: string): Promise<void> => {
    await apiFetch<{ success: boolean, data: any }>(`/users/check-availability/${username}`, {
      method: "GET",
    });
  }
};

// Friends

export const friendApi = {
	getFriends: async (accessToken: string): Promise<string[]> => {
		const res = await apiFetch<{ success: boolean, data: string[] }>("/friends", {
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			}
		});
		return res.data;
	},

	getProfiles: async (accessToken: string): Promise<PublicUser[]> => {
		const res = await apiFetch<{ success: boolean, data: PublicUser[] }>("/friends/profiles", {
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			}
		});
		return res.data;
	},

	getIncomingRequests: async (accessToken: string): Promise<PublicUser[]> => {
		const res = await apiFetch<{ success: boolean, data: PublicUser[] }>("/friends/requests/incoming", {
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			}
		});
		return res.data;
	},

	getOutgoingRequests: async (accessToken: string): Promise<PublicUser[]> => {
		const res = await apiFetch<{ success: boolean, data: PublicUser[] }>("/friends/requests/outgoing", {
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			}
		});
		return res.data;
	},

	isFriend: async (accessToken: string, userId: string): Promise<boolean> => {
		const res = await apiFetch<{ success: boolean, data: boolean }>(`/friends/status/${userId}`, {
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			}
		});
		return res.data;
	},

	sendRequest: async (accessToken: string, userId: string): Promise<void> => {
		await apiFetch("/friends/requests", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ userId })
		});
	},

	acceptRequest: async (accessToken: string, senderId: string): Promise<void> => {
		await apiFetch("/friends/requests/accept", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ senderId })
		});
	},

	declineRequest: async (accessToken: string, senderId: string): Promise<void> => {
		await apiFetch("/friends/requests/decline", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ senderId })
		});
	},

	cancelRequest: async (accessToken: string, userId: string): Promise<void> => {
		await apiFetch("/friends/requests", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ userId })
		});
	},

	removeFriend: async (accessToken: string, userId: string): Promise<void> => {
		await apiFetch("/friends", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ userId })
		});
	}
};

export const gamesApi = {
	getGame: async (gameId: string): Promise<GameData> => {
		const res = await apiFetch<{ success: boolean, data: GameData }>(
			`/games/${gameId}`, {
				headers: { "Content-Type": "application/json" }
			}
		);
		return res.data;
	},

	getResult: async (gameId: string): Promise<CompletedGameData> => {
		const tokens = getTokens();
		const res = await apiFetch<{ success: boolean, data: CompletedGameData }>(
			"/games/" + gameId + "/result", {
				headers: tokens?.accessToken ? { "Authorization": "Bearer " + tokens.accessToken } : undefined
			}
		);
		return res.data;
	},

	recreateGame: async (gameId: string): Promise<RecreatedGame> => {
		const tokens = getTokens();
		const res = await apiFetch<{ success: boolean, data: RecreatedGame }>(
			`/games/recreate/${gameId}`, {
				method: "GET",
				headers: tokens?.accessToken ? { "Authorization": "Bearer " + tokens.accessToken } : undefined
			}
		);

		return res.data;
	}
};

// Chat

export const chatApi = {
	// Conversation history with another user, newest message first.
	getHistory: async (
		accessToken: string,
		userId: string,
		opts?: { limit?: number; before?: string },
	): Promise<ChatMessage[]> => {
		const params = new URLSearchParams();
		if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
		if (opts?.before !== undefined) params.set("before", opts.before);
		const query = params.toString();
		const res = await apiFetch<{ success: boolean, data: ChatMessage[] }>(
			`/chats/${userId}${query ? `?${query}` : ""}`, {
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				}
		});
		return res.data;
	},

	getUnread: async (accessToken: string): Promise<UnreadChat[]> => {
		const res = await apiFetch<{ success: boolean, data: UnreadChat[] }>(
			"/chats/unread", {
				headers: { "Authorization": `Bearer ${accessToken}` }
			}
		);
		return res.data;
	},

	markRead: async (accessToken: string, userId: string): Promise<void> => {
		await apiFetch(`/chats/${userId}/read`, {
			method: "PATCH",
			headers: { "Authorization": `Bearer ${accessToken}` }
		});
	},
};

//   Leaderboard

export const leaderboardApi = {
  getTop: async (limit = 50): Promise<LeaderboardEntry[]> => {
    const res = await apiFetch<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
    return res.data;
  },
};

export default { auth: authApi, user: userApi, friend: friendApi, chat: chatApi, leaderboard: leaderboardApi };
