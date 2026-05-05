import { type Response, type Request, type NextFunction } from "express";
import { ZodError, type ZodObject } from "zod";

export function validateBody(bodyValidator: ZodObject) {
  return (
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        bodyValidator.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError)
          throw ("INVALID_REQUEST");
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
        if (err instanceof ZodError)
          throw ("INVALID_REQUEST");
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
        if (err instanceof ZodError)
          throw ("INVALID_REQUEST");
        throw err;
      }
      next();
    });
}