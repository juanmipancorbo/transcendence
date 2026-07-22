"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.loginUser = loginUser;
exports.loginUserGoogle = loginUserGoogle;
exports.generateTokens = generateTokens;
exports.refreshAccessToken = refreshAccessToken;
exports.getFullUserById = getFullUserById;
exports.logoutUser = logoutUser;
exports.logoutAllSessions = logoutAllSessions;
const argon2 = __importStar(require("argon2"));
const Repo = __importStar(require("./repository"));
const pg_1 = require("pg");
const jwt_utils_1 = require("@utils/jwt-utils");
const crypto_1 = require("crypto");
const error_1 = require("@utils/error");
function createUser(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashPassword = yield argon2.hash(input.password);
        try {
            yield Repo.insertUser(input.email, input.username, hashPassword);
        }
        catch (err) {
            if (!(err instanceof pg_1.DatabaseError) || err.code !== "23505")
                throw err;
            throw (new error_1.ApiError("Email or username is already taken", 409));
        }
    });
}
function loginUser(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield Repo.selectAuthUser(input.email);
        if (!user)
            throw (new error_1.ApiError("Invalid credentials", 401));
        if (!(yield argon2.verify(user.password_hash, input.password)))
            throw (new error_1.ApiError("Invalid credentials", 401));
        delete user.password_hash;
        return (user);
    });
}
function loginUserGoogle(email, username, avatar) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield Repo.selectFullUserByEmail(email);
        if (!user)
            return yield Repo.insertUserGoogle(email, username, avatar);
        return user;
    });
}
function generateTokens(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username
        };
        const accessToken = jwt_utils_1.tokenUtils.signAccessToken(payload);
        const refreshToken = jwt_utils_1.tokenUtils.signRefreshToken(payload);
        // Save refresh token hash to DB
        const tokenHash = (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        yield Repo.saveRefreshToken(user.id, tokenHash, expiresAt);
        return {
            accessToken,
            refreshToken
        };
    });
}
function refreshAccessToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = jwt_utils_1.tokenUtils.verifyRefreshToken(refreshToken);
            // Check if token exists in DB
            const tokenHash = (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex');
            const exists = yield Repo.findRefreshToken(payload.id, tokenHash);
            if (!exists)
                throw new error_1.ApiError('Refresh token not found or expired', 401);
            // Generate new access token
            const newAccessToken = jwt_utils_1.tokenUtils.signAccessToken(payload);
            return { accessToken: newAccessToken };
        }
        catch (error) {
            throw (new error_1.ApiError('Invalid refresh token', 401));
        }
    });
}
function getFullUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectFullUserById(userId);
    });
}
function logoutUser(userId, refreshTokenHash) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Repo.deleteRefreshToken(userId, refreshTokenHash);
    });
}
function logoutAllSessions(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Repo.deleteAllUserSessions(userId);
    });
}
