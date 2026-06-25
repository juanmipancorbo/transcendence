import type { Request, Response } from "express";
import * as Service from "./service";
import { LoginReq, RegisterReq } from "@endpoints/users-request";
import { createHash } from 'crypto';
import { ApiError } from "@utils/error";

function sendAuthError(res: Response, error: unknown) {
  if (error instanceof ApiError)
    return res.status(error.statusCode).json({ success: false, error: error.message });
  if (error instanceof Error)
    return res.status(400).json({ success: false, error: error.message });
  return res.status(400).json({ success: false, error: String(error) });
}

export async function postRegister(req: Request<unknown, unknown, RegisterReq>, res: Response)
{
  try {
    // Create user
    await Service.createUser(req.body);
    
    // Login to get tokens
    const user = await Service.loginUser(req.body);
    if (user.password_hash)
      delete user.password_hash;
    
    // Generate tokens
    const tokens = await Service.generateTokens(user);
    
    return res.status(201).json({
      success: true, 
      data: {
        user,
        ...tokens
      }
    });
  } catch (error: any) {
    return sendAuthError(res, error);
  }
}

export async function postLogin(req: Request<unknown, unknown, LoginReq>, res: Response)
{
  try {
    const user = await Service.loginUser(req.body);
    if (user.password_hash)
      delete user.password_hash;
    
    // Generate tokens
    const tokens = await Service.generateTokens(user);
    
    return res.status(200).json({
      success: true, 
      data: {
        user,
        ...tokens
      }
    });
  } catch (error: any) {
    return sendAuthError(res, error);
  }
}

export async function getMe(req: Request, res: Response)
{
	const userId = (req as any).userId;
	try {
		const user = await Service.getFullUserById(userId);
		if (!user)
			return res.status(404).json({ success: false, error: 'User not found' });

		return res.status(200).json({ success: true, data: user });
	} catch (error: any) {
		return res.status(400).json({ success: false, error: error.message });
	}
}

export async function postRefresh(req: Request, res: Response)
{
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }
    
    const result = await Service.refreshAccessToken(refreshToken);
    
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
}

export async function postLogout(req: Request, res: Response)
{
  try {
    const userId = (req as any).userId;
    const { refreshToken } = req.body;
    
    if (!userId || !refreshToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await Service.logoutUser(userId, tokenHash);
    
    return res.status(200).json({ success: true, data: null });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
