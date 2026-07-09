import { Request, Response, NextFunction } from 'express';
import { tokenUtils, TokenPayload } from '@utils/jwt-utils';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  console.log(token);

  try {
    const payload = tokenUtils.verifyAccessToken(token);
    req.userId = payload.id;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
