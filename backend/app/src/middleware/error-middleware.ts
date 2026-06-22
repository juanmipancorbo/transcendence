import { Request, Response, NextFunction } from 'express';
import { ApiError } from "@utils/error";

export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      data: err.message,
    });
  }

  // Fallback for unexpected errors
  res.status(500).json({
    success: false,
    data: "Internal Server Error",
  });
};