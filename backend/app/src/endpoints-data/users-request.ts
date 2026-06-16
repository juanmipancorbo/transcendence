import z from "zod";
import { validationError as vError } from "./validation-errors";

export const IdSchema = z.strictObject({
	id: z.string()
})

export type Id = z.infer<typeof IdSchema>;

export const FullUserReqSchema = z.strictObject({
  username: z.string()
    .min(3, vError.tooShort)
    .max(16, vError.tooLong)
});

export type FullUserReq = z.infer<typeof FullUserReqSchema>;

export const RegisterReqSchema = z.strictObject({
  email: z.email(vError.invalidEmail),
  username: z.string()
    .min(3, vError.tooShort)
    .max(16, vError.tooLong),
  password: z.string()
    .min(8, vError.tooShort)
    .max(16, vError.tooLong)
    .regex(/[a-z]/, vError.lowerCase)
    .regex(/[A-Z]/, vError.upperCase)
    .regex(/[0-9]/, vError.digit)
    .regex(/[^a-zA-Z0-9]/, vError.symbol)
});

export type RegisterReq = z.infer<typeof RegisterReqSchema>;

export const LoginReqSchema = z.strictObject({
  email: z.email(vError.invalidEmail),
  password: z.string(),
})

export type LoginReq = z.infer<typeof LoginReqSchema>;
