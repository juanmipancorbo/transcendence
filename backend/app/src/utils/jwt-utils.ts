import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_secret_change_in_prod';
const ACCESS_TOKEN_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenUtils = {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as any);
  },

  signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as any);
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  },

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  decodeToken(token: string) {
    return jwt.decode(token);
  }
};
