import * as argon2 from "argon2"
import * as Repo from "./repository"
import { DatabaseError } from "pg";
import { AuthUser } from "@endpoints/users-response";
import { tokenUtils, TokenPayload } from "@utils/jwt-utils";
import { createHash } from 'crypto';

export async function createUser(input: {email: string, username: string, password: string})
{
  const hashPassword = await argon2.hash(input.password);// TODO thrown error are handled at errMiddleware
  // REMARK generateToken() // Should we use a verification token?
  try {
    await Repo.insertUser(input.email, input.username, hashPassword)
  } catch (err) {
    if (!(err instanceof DatabaseError) || err.code !== "23505") throw err;
    throw ("INVALID_CREDENTIAL");
  }
}

export async function loginUser(input: {email: string, password: string}): Promise<AuthUser>
{
  const user = await Repo.selectAuthUser(input.email);
  if (!user)
    throw new Error("USER_NOT_FOUND");
  if (!await argon2.verify(user.password_hash as any, input.password))
    throw new Error("INVALID_PASSWORD");
  delete user.password_hash;
  return (user)
}

export async function generateTokens(user: AuthUser) {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    username: user.username
  };

  const accessToken = tokenUtils.signAccessToken(payload);
  const refreshToken = tokenUtils.signRefreshToken(payload);

  // Save refresh token hash to DB
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await Repo.saveRefreshToken(user.id, tokenHash, expiresAt);

  return {
    accessToken,
    refreshToken
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = tokenUtils.verifyRefreshToken(refreshToken);
    
    // Check if token exists in DB
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const exists = await Repo.findRefreshToken(payload.id, tokenHash);
    
    if (!exists) {
      throw new Error('Refresh token not found or expired');
    }

    // Generate new access token
    const newAccessToken = tokenUtils.signAccessToken(payload);
    
    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export async function logoutUser(userId: string, refreshTokenHash: string) {
  await Repo.deleteRefreshToken(userId, refreshTokenHash);
}

export async function logoutAllSessions(userId: string) {
  await Repo.deleteAllUserSessions(userId);
}