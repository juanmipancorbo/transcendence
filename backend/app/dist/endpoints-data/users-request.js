"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleLoginReqSchema = exports.LoginReqSchema = exports.RegisterReqSchema = exports.UpdateBioReqSchema = exports.FullUserReqSchema = exports.ProfileReqSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_errors_1 = require("./validation-errors");
exports.ProfileReqSchema = zod_1.default.strictObject({
    id: zod_1.default.uuid(),
});
exports.FullUserReqSchema = zod_1.default.strictObject({
    username: zod_1.default.string()
        .min(3, validation_errors_1.validationError.tooShort)
        .max(16, validation_errors_1.validationError.tooLong)
});
exports.UpdateBioReqSchema = zod_1.default.strictObject({
    bio: zod_1.default.string().max(160, validation_errors_1.validationError.tooLong)
});
exports.RegisterReqSchema = zod_1.default.strictObject({
    email: zod_1.default.email(validation_errors_1.validationError.invalidEmail),
    username: zod_1.default.string()
        .min(3, validation_errors_1.validationError.tooShort)
        .max(16, validation_errors_1.validationError.tooLong),
    password: zod_1.default.string()
        .min(8, validation_errors_1.validationError.tooShort)
        .max(16, validation_errors_1.validationError.tooLong)
        .regex(/[a-z]/, validation_errors_1.validationError.lowerCase)
        .regex(/[A-Z]/, validation_errors_1.validationError.upperCase)
        .regex(/[0-9]/, validation_errors_1.validationError.digit)
        .regex(/[^a-zA-Z0-9]/, validation_errors_1.validationError.symbol)
});
exports.LoginReqSchema = zod_1.default.strictObject({
    email: zod_1.default.email(validation_errors_1.validationError.invalidEmail),
    password: zod_1.default.string(),
});
exports.GoogleLoginReqSchema = zod_1.default.strictObject({
    code: zod_1.default.string()
});
