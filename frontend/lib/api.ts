
import type { User, LeaderboardEntry } from "@/types";

//   Mock data                      

export const MOCK_USER: User = {
  id: "1",
  username: "neon_razor",
  displayName: "NeonRazor",
  avatarUrl: undefined,
  status: "online",
  xp: 4200,
  level: 4,
  rank: 3,
  wins: 38,
  losses: 12,
  createdAt: "2024-01-01",
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { id: "2", username: "v_specter",   displayName: "V_Specter",   avatarUrl: undefined, status: "in-game" }, wins: 91, losses: 9,  xp: 12400, winRate: 91 },
  { rank: 2, user: { id: "3", username: "cyber_druid", displayName: "CyberDruid",  avatarUrl: undefined, status: "online"  }, wins: 76, losses: 14, xp: 9800,  winRate: 84 },
  { rank: 3, user: { id: "1", username: "neon_razor",  displayName: "NeonRazor",   avatarUrl: undefined, status: "online"  }, wins: 38, losses: 12, xp: 4200,  winRate: 76 },
  { rank: 4, user: { id: "4", username: "void_proxy",  displayName: "VoidProxy",   avatarUrl: undefined, status: "offline" }, wins: 21, losses: 19, xp: 2100,  winRate: 52 },
  { rank: 5, user: { id: "5", username: "arc_vector",  displayName: "ArcVector",   avatarUrl: undefined, status: "offline" }, wins: 15, losses: 25, xp: 1100,  winRate: 37 },
];

//   Auth                      

export const authApi = {
  /** TODO: POST /api/auth/login  */
  login: async (_username: string, _password: string): Promise<void> => {
    //does nothing
  },

  /** TODO: POST /api/auth/register */
  register: async (_username: string, _email: string, _password: string): Promise<void> => {
    // stub
  },

  /** TODO: POST /api/auth/logout */
  logout: async (): Promise<void> => {
    // stub
  },

  /** TODO: GET /api/auth/me — return the current user */
  me: async (): Promise<User> => {
    return MOCK_USER;
  },
};

//   User                      

export const userApi = {
  /** TODO: GET /api/users/:id */
  getProfile: async (_userId: string): Promise<User> => {
    return MOCK_USER;
  },

  /** TODO: PATCH /api/users/:id */
  updateProfile: async (_userId: string, data: Partial<User>): Promise<User> => {
    return { ...MOCK_USER, ...data };
  },
};

//   Leaderboard

export const leaderboardApi = {
  /** TODO: GET /api/leaderboard */
  getTop: async (_limit = 50): Promise<LeaderboardEntry[]> => {
    return MOCK_LEADERBOARD;
  },
};

export default { auth: authApi, user: userApi, leaderboard: leaderboardApi };
