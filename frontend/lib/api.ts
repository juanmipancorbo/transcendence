
import type { User, LeaderboardEntry } from "@/types";
import { getTokens, setTokens } from "./auth-storage";

// Set up for real backend

import { API_URL } from "./config";

async function apiFetch<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
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

  const rawError = json?.error ?? json?.message ?? text;

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

//   Mock data                      

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { id: "2", username: "v_specter",   displayName: "V_Specter",   avatarUrl: undefined, status: "in-game" }, wins: 91, losses: 9,  xp: 12400, winRate: 91 },
  { rank: 2, user: { id: "3", username: "cyber_druid", displayName: "CyberDruid",  avatarUrl: undefined, status: "online"  }, wins: 76, losses: 14, xp: 9800,  winRate: 84 },
  { rank: 3, user: { id: "1", username: "neon_razor",  displayName: "NeonRazor",   avatarUrl: undefined, status: "online"  }, wins: 38, losses: 12, xp: 4200,  winRate: 76 },
  { rank: 4, user: { id: "4", username: "void_proxy",  displayName: "VoidProxy",   avatarUrl: undefined, status: "offline" }, wins: 21, losses: 19, xp: 2100,  winRate: 52 },
  { rank: 5, user: { id: "5", username: "arc_vector",  displayName: "ArcVector",   avatarUrl: undefined, status: "offline" }, wins: 15, losses: 25, xp: 1100,  winRate: 37 },
];

//   Auth                      

export const authApi = {
  login: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
    const res = await apiFetch<{ success: boolean; data: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: {
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
      },
    };
  },

  register: async (email: string, username: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> => {
    const res = await apiFetch<{ success: boolean; data: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    return {
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: {
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
      },
    };
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiFetch("/auth/logout", {
      method: "POST",
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
  getProfile: async (userId: string): Promise<User> => {
    const res = await apiFetch<{ success: boolean; data: {
      id: string; username: string; email: string; avatarUrl?: string;
      gamesPlayed: number; gamesWon: number; gamesLost: number; xp: number; level: number;
    } }>(`/users/profile/${userId}`);
    const d = res.data;
    return {
      id: d.id,
      username: d.username,
      email: d.email,
      displayName: d.username,
      avatarUrl: d.avatarUrl,
      status: "online",
      xp: d.xp,
      level: d.level,
      rank: 0,
      wins: d.gamesWon,
      losses: d.gamesLost,
      createdAt: "",
    };
  },

  /** TODO: PATCH /api/users/:id */
  updateProfile: async (_userId: string, _data: Partial<User>): Promise<User> => {
    return Promise.reject(new Error("updateProfile not yet implemented"));
  },
};

//   Leaderboard

export const leaderboardApi = {
  /** TODO: GET /api/leaderboard */
  getTop: async (_limit = 50): Promise<LeaderboardEntry[]> => {
    return Promise.reject(new Error("getTop not yet implemented"));
  },
};

export default { auth: authApi, user: userApi, leaderboard: leaderboardApi };
