import { type Response, type Request, type NextFunction } from "express";
import { ZodError, type ZodObject } from "zod";

export function validateBody(bodyValidator: ZodObject) {
  return (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        bodyValidator.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          const messages = err.issues.map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path} ${issue.message}` : issue.message;
          });
          const uniqueMessages = Array.from(new Set(messages));
          return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
        }
        throw err;
      }
      next();
    });
}

export function validateQuery(queryValidator: ZodObject) {
  return (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        queryValidator.parse(req.query);
      } catch (err) {
        if (err instanceof ZodError) {
          const messages = err.issues.map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path} ${issue.message}` : issue.message;
          });
          const uniqueMessages = Array.from(new Set(messages));
          return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
        }
        throw err;
      }
      next();
    });
}

export function validateParams(paramsValidator: ZodObject) {
  return (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        paramsValidator.parse(req.params);
      } catch (err) {
        if (err instanceof ZodError) {
          const messages = err.issues.map((issue) => {
            const path = issue.path.join(".");
            return path ? `${path} ${issue.message}` : issue.message;
          });
          const uniqueMessages = Array.from(new Set(messages));
          return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
        }
        throw err;
      }
      next();
    });
}