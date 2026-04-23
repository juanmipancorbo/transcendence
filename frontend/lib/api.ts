

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const leaderboardApi = {
  getTop: async () => [],
};

export const authApi = {
  login: async () => ({}),
  register: async () => ({}),
  me: async () => null,
};