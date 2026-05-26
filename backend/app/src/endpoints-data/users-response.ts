export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  current_game?: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken?: string;
}
