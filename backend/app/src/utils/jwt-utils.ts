import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

type VerifiedTokenPayload = TokenPayload & {
  tokenType: 'access' | 'refresh';
};

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenUtils = {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload, tokenType: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as any);
  },

  signRefreshToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload, tokenType: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as any);
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as VerifiedTokenPayload;
      if (payload.tokenType !== 'access') throw new Error();
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  },

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as VerifiedTokenPayload;
      if (payload.tokenType !== 'refresh') throw new Error();
      return payload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  decodeToken(token: string) {
    return jwt.decode(token);
  }
};
