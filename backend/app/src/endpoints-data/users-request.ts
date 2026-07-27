import z from "zod";
import { validationError as vError } from "./validation-errors";

export const ProfileReqSchema = z.strictObject({
	id: z.uuid(),
});

export type ProfileReq = z.infer<typeof ProfileReqSchema>;

export const PageReqSchema = z.strictObject({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	before: z.coerce.date().optional(),
});

export type PageReq = z.infer<typeof PageReqSchema>;

export const FullUserReqSchema = z.strictObject({
  username: z.string()
    .min(3, vError.tooShort)
    .max(16, vError.tooLong)
});

export type FullUserReq = z.infer<typeof FullUserReqSchema>;

export const UpdateBioReqSchema = z.strictObject({
  bio: z.string().max(160, vError.tooLong)
});

export type UpdateBioReq = z.infer<typeof UpdateBioReqSchema>;

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

export const GoogleLoginReqSchema = z.strictObject({
  code: z.string()
});

export type GoogleLoginReq = z.infer<typeof GoogleLoginReqSchema>;
