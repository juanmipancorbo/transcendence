
import type { User, LeaderboardEntry, PublicUser, ChatMessage } from "@/types";
import { getTokens, setTokens } from "./auth-storage";

// Set up for real backend

import { API_URL } from "./config";

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
};

async function apiFetch<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (res.status === 401 && !_isRetry) {
    const tokens = getTokens();
    if (tokens?.refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        if (refreshRes.ok) {
          const body = await refreshRes.json();
          const newAccessToken: string = body.data.accessToken;
          setTokens({ accessToken: newAccessToken, refreshToken: tokens.refreshToken });
          const headers = { ...(options?.headers as Record<string, string> ?? {}) };
          if (headers["Authorization"]) headers["Authorization"] = `Bearer ${newAccessToken}`;
          return apiFetch<T>(path, { ...options, headers }, true);
        }
      } catch { /* fall through to original 401 error */ }
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

  updateProfile: async (_userId: string, data: Partial<User>): Promise<boolean> => {
    if (!data.username)
      return true;

    const tokens = getTokens();
    await apiFetch<{ success: boolean; data: null }>("/users/username", {
      method: "PATCH",
      headers: tokens?.accessToken ? { "Authorization": `Bearer ${tokens.accessToken}` } : undefined,
      body: JSON.stringify({ username: data.username }),
    });
    return true;
  },
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

// Chat

export const chatApi = {
	/** Conversation history with another user, newest message first.
	 *  `before` is a cursor (a message's createdAt) for fetching older pages. */
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
};

//   Leaderboard

export const leaderboardApi = {
  getTop: async (limit = 50): Promise<LeaderboardEntry[]> => {
    const res = await apiFetch<{ success: boolean; data: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
    return res.data;
  },
};

export default { auth: authApi, user: userApi, friend: friendApi, chat: chatApi, leaderboard: leaderboardApi };
